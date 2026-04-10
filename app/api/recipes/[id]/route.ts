import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { member, organization, recipe, recipeImage } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// ─── Helper: resolve org name ─────────────────────────────────────────────────

async function resolveOrgName(
  organizationId: string | null,
): Promise<string | null> {
  if (!organizationId) return null;
  const [org] = await db
    .select({ name: organization.name })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);
  return org?.name ?? null;
}

// ─── Helper: check visibility ─────────────────────────────────────────────────

async function canSeeRecipe(
  userId: string,
  recipeRow: typeof recipe.$inferSelect,
) {
  if (recipeRow.createdById === userId) return true;
  if (!recipeRow.organizationId) return false;
  const membership = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(
        eq(member.organizationId, recipeRow.organizationId),
        eq(member.userId, userId),
      ),
    )
    .limit(1);
  return membership.length > 0;
}

// ─── GET /api/recipes/[id] ────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [row] = await db
    .select()
    .from(recipe)
    .where(eq(recipe.id, id))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!(await canSeeRecipe(session.user.id, row))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [images, orgName] = await Promise.all([
    db.select().from(recipeImage).where(eq(recipeImage.recipeId, id)),
    resolveOrgName(row.organizationId),
  ]);
  const sorted = images.sort((a, b) => a.order - b.order);

  return NextResponse.json({
    ...row,
    images: sorted,
    image: sorted[0]?.url ?? null,
    organizationName: orgName,
  });
}

// ─── PATCH /api/recipes/[id] ──────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [row] = await db
    .select()
    .from(recipe)
    .where(eq(recipe.id, id))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { image, images: newImages, ...fields } = body;

  // Build only defined update fields
  const updateData: Partial<typeof row> = {};
  const allowed = [
    "title",
    "description",
    "ingredients",
    "instructions",
    "cookingTime",
    "servings",
    "rating",
    "organizationId",
  ] as const;
  for (const key of allowed) {
    if (key in fields)
      (updateData as Record<string, unknown>)[key] = fields[key];
  }

  if (Object.keys(updateData).length > 0) {
    await db
      .update(recipe)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(recipe.id, id));
  }

  // Replace images when provided
  if (image !== undefined || newImages !== undefined) {
    const allImages = [
      ...(image ? [image] : []),
      ...(Array.isArray(newImages)
        ? newImages.filter((u: string) => u && u !== image)
        : []),
    ];
    await db.delete(recipeImage).where(eq(recipeImage.recipeId, id));
    if (allImages.length > 0) {
      const now = new Date();
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
  }

  // Return updated recipe with org name
  const [updated] = await db
    .select()
    .from(recipe)
    .where(eq(recipe.id, id))
    .limit(1);
  const [imgs, updatedOrgName] = await Promise.all([
    db.select().from(recipeImage).where(eq(recipeImage.recipeId, id)),
    resolveOrgName(updated.organizationId),
  ]);
  const sorted = imgs.sort((a, b) => a.order - b.order);

  return NextResponse.json({
    ...updated,
    images: sorted,
    image: sorted[0]?.url ?? null,
    organizationName: updatedOrgName,
  });
}

// ─── DELETE /api/recipes/[id] ─────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [row] = await db
    .select()
    .from(recipe)
    .where(eq(recipe.id, id))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(recipe).where(eq(recipe.id, id)); // cascade deletes images + meal plans
  return NextResponse.json({ success: true });
}
