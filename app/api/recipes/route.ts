import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { member, recipe, recipeImage } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return every organizationId the signed-in user belongs to. */
async function getUserOrgIds(userId: string): Promise<string[]> {
  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId));
  return memberships.map((m) => m.organizationId);
}

/** Fetch recipes (with images) that are visible to the user. */
async function getVisibleRecipes(userId: string, orgIds: string[]) {
  // Fetch all recipes that belong to any of the user's orgs
  const rows =
    orgIds.length > 0
      ? await db
          .select()
          .from(recipe)
          .where(inArray(recipe.organizationId, orgIds))
      : await db
          .select()
          .from(recipe)
          .where(eq(recipe.createdById, userId));

  if (rows.length === 0) return [];

  const recipeIds = rows.map((r) => r.id);
  const images = await db
    .select()
    .from(recipeImage)
    .where(inArray(recipeImage.recipeId, recipeIds));

  return rows.map((r) => {
    const imgs = images
      .filter((img) => img.recipeId === r.id)
      .sort((a, b) => a.order - b.order);
    return {
      ...r,
      images: imgs,
      image: imgs[0]?.url ?? null,
    };
  });
}

// ─── GET /api/recipes ─────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgIds = await getUserOrgIds(session.user.id);
  const recipes = await getVisibleRecipes(session.user.id, orgIds);
  return NextResponse.json(recipes);
}

// ─── POST /api/recipes ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    description = null,
    ingredients,
    instructions,
    cookingTime = null,
    servings = null,
    rating = 0,
    organizationId = null,
    image = null,
    images: extraImages = [],
  } = body;

  if (!title || !ingredients || !instructions) {
    return NextResponse.json(
      { error: "title, ingredients and instructions are required" },
      { status: 400 },
    );
  }

  // Validate org membership when an org is supplied
  if (organizationId) {
    const membership = await db
      .select({ id: member.id })
      .from(member)
      .where(
        eq(member.organizationId, organizationId) &&
          eq(member.userId, session.user.id),
      )
      .limit(1);
    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 },
      );
    }
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(recipe).values({
    id,
    title,
    description,
    ingredients,
    instructions,
    cookingTime,
    servings,
    rating,
    createdById: session.user.id,
    organizationId,
    createdAt: now,
    updatedAt: now,
  });

  // Collect all image URLs (primary first, then extras)
  const allImages = [
    ...(image ? [image] : []),
    ...extraImages.filter((url: string) => url && url !== image),
  ];

  if (allImages.length > 0) {
    await db.insert(recipeImage).values(
      allImages.map((url: string, i: number) => ({
        id: crypto.randomUUID(),
        recipeId: id,
        url,
        order: i,
        createdAt: now,
      })),
    );
  }

  const imgs = allImages.map((url: string, i: number) => ({
    id: crypto.randomUUID(),
    recipeId: id,
    url,
    order: i,
    createdAt: now.toISOString(),
  }));

  return NextResponse.json(
    {
      id,
      title,
      description,
      ingredients,
      instructions,
      cookingTime,
      servings,
      rating,
      createdById: session.user.id,
      organizationId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      images: imgs,
      image: imgs[0]?.url ?? null,
    },
    { status: 201 },
  );
}
