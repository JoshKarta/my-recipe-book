import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { mealPlan, member } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// ─── DELETE /api/meal-plans/[id] ──────────────────────────────────────────────
// Deletes a specific meal-plan entry.
// The caller may also use DELETE /api/meal-plans?date=X&mealType=Y (see route.ts).

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [row] = await db
    .select()
    .from(mealPlan)
    .where(eq(mealPlan.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the creator (or an org member) may delete
  const isCreator = row.createdById === session.user.id;
  let isOrgMember = false;

  if (!isCreator && row.organizationId) {
    const membership = await db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, row.organizationId),
          eq(member.userId, session.user.id),
        ),
      )
      .limit(1);
    isOrgMember = membership.length > 0;
  }

  if (!isCreator && !isOrgMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(mealPlan).where(eq(mealPlan.id, id));
  return NextResponse.json({ success: true });
}
