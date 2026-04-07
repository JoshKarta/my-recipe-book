import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { mealPlan, member } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { MealType } from "@/lib/types";

const VALID_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

async function getUserOrgIds(userId: string): Promise<string[]> {
  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId));
  return memberships.map((m) => m.organizationId);
}

// ─── GET /api/meal-plans ──────────────────────────────────────────────────────
// Returns all meal-plan entries visible to the user, shaped as:
//   { [date]: { [mealType]: recipeId } }

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgIds = await getUserOrgIds(session.user.id);

  const rows =
    orgIds.length > 0
      ? await db
          .select()
          .from(mealPlan)
          .where(inArray(mealPlan.organizationId, orgIds))
      : await db
          .select()
          .from(mealPlan)
          .where(eq(mealPlan.createdById, session.user.id));

  // Shape into { [date]: { [mealType]: recipeId } }
  const shaped: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    if (!shaped[row.date]) shaped[row.date] = {};
    shaped[row.date][row.mealType] = row.recipeId;
  }

  return NextResponse.json(shaped);
}

// ─── POST /api/meal-plans ─────────────────────────────────────────────────────
// Upserts a single meal-plan slot: { date, mealType, recipeId, organizationId? }

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    date,
    mealType: mealTypeInput,
    recipeId,
    organizationId = null,
  } = body;

  if (!date || !mealTypeInput || !recipeId) {
    return NextResponse.json(
      { error: "date, mealType and recipeId are required" },
      { status: 400 },
    );
  }

  if (!VALID_MEAL_TYPES.includes(mealTypeInput)) {
    return NextResponse.json({ error: "Invalid mealType" }, { status: 400 });
  }

  // Validate org membership when an org is supplied
  if (organizationId) {
    const membership = await db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, session.user.id),
        ),
      )
      .limit(1);
    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 },
      );
    }
  }

  // Upsert: delete any existing slot for the same date+mealType+org, then insert
  if (organizationId) {
    await db
      .delete(mealPlan)
      .where(
        and(
          eq(mealPlan.date, date),
          eq(mealPlan.mealType, mealTypeInput),
          eq(mealPlan.organizationId, organizationId),
        ),
      );
  } else {
    await db
      .delete(mealPlan)
      .where(
        and(
          eq(mealPlan.date, date),
          eq(mealPlan.mealType, mealTypeInput),
          eq(mealPlan.createdById, session.user.id),
        ),
      );
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(mealPlan).values({
    id,
    date,
    mealType: mealTypeInput,
    recipeId,
    createdById: session.user.id,
    organizationId,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json(
    {
      id,
      date,
      mealType: mealTypeInput,
      recipeId,
      organizationId,
      createdById: session.user.id,
    },
    { status: 201 },
  );
}

// ─── DELETE /api/meal-plans?date=X&mealType=Y ─────────────────────────────────
// Removes the meal-plan slot for the calling user's org (or personal).

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const mealTypeInput = searchParams.get("mealType");

  if (!date || !mealTypeInput) {
    return NextResponse.json(
      { error: "date and mealType query params are required" },
      { status: 400 },
    );
  }

  const orgIds = await getUserOrgIds(session.user.id);

  if (orgIds.length > 0) {
    await db
      .delete(mealPlan)
      .where(
        and(
          eq(mealPlan.date, date),
          eq(mealPlan.mealType, mealTypeInput),
          inArray(mealPlan.organizationId, orgIds),
        ),
      );
  } else {
    await db
      .delete(mealPlan)
      .where(
        and(
          eq(mealPlan.date, date),
          eq(mealPlan.mealType, mealTypeInput),
          eq(mealPlan.createdById, session.user.id),
        ),
      );
  }

  return NextResponse.json({ success: true });
}
