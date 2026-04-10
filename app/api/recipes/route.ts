import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { member, organization, recipe, recipeImage } from "@/db/schema";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
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

/** Fetch recipes (with images + org name) that are visible to the user. */
async function getVisibleRecipes(userId: string, orgIds: string[]) {
  // Always include the user's personal recipes (organizationId IS NULL) plus
  // every recipe that belongs to one of their orgs.
  const rows = await db
    .select()
    .from(recipe)
    .where(
      or(
        // Org-scoped recipes the user can see
        orgIds.length > 0 ? inArray(recipe.organizationId, orgIds) : undefined,
        // Personal recipes created by this user
        and(eq(recipe.createdById, userId), isNull(recipe.organizationId)),
      ),
    );

  if (rows.length === 0) return [];

  const recipeIds = rows.map((r) => r.id);
  const uniqueOrgIds = [
    ...new Set(rows.map((r) => r.organizationId).filter(Boolean) as string[]),
  ];

  const [images, orgs] = await Promise.all([
    db
      .select()
      .from(recipeImage)
      .where(inArray(recipeImage.recipeId, recipeIds)),
    uniqueOrgIds.length > 0
      ? db
          .select({ id: organization.id, name: organization.name })
          .from(organization)
          .where(inArray(organization.id, uniqueOrgIds))
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);

  const orgNameMap = Object.fromEntries(orgs.map((o) => [o.id, o.name]));

  return rows.map((r) => {
    const imgs = images
      .filter((img) => img.recipeId === r.id)
      .sort((a, b) => a.order - b.order);
    return {
      ...r,
      images: imgs,
      image: imgs[0]?.url ?? null,
      organizationName: r.organizationId
        ? (orgNameMap[r.organizationId] ?? null)
        : null,
    };
  });
}

// ─── GET /api/recipes ─────────────────────────────────────────────────────────
// Optional ?organizationId= to filter to a specific org.
// Without it, returns all recipes visible to the user across every org they belong to.

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filterOrgId = searchParams.get("organizationId");

  if (filterOrgId) {
    // Verify the user is actually a member of the requested org
    const membership = await db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, filterOrgId),
          eq(member.userId, session.user.id),
        ),
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recipes = await getVisibleRecipes(session.user.id, [filterOrgId]);
    return NextResponse.json(recipes);
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

  // Resolve org name for the response
  let organizationName: string | null = null;
  if (organizationId) {
    const [org] = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);
    organizationName = org?.name ?? null;
  }

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
      organizationName,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      images: imgs,
      image: imgs[0]?.url ?? null,
    },
    { status: 201 },
  );
}
