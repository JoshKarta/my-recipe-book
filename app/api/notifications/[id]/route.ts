import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { notification } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function getAuthedNotification(
  session: Awaited<ReturnType<typeof auth.api.getSession>>,
  id: string,
) {
  if (!session) return null;
  const rows = await db
    .select()
    .from(notification)
    .where(
      and(eq(notification.id, id), eq(notification.userId, session.user.id)),
    )
    .limit(1);
  return rows[0] ?? null;
}

// PATCH /api/notifications/[id]  — mark as read
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await getAuthedNotification(session, id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(notification)
    .set({ read: true })
    .where(eq(notification.id, id));

  return NextResponse.json({ success: true });
}

// DELETE /api/notifications/[id]  — dismiss
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await getAuthedNotification(session, id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(notification).where(eq(notification.id, id));

  return NextResponse.json({ success: true });
}
