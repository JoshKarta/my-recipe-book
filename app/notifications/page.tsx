import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NotificationsPageClient } from "@/components/notifications-page-client";

export const metadata = { title: "Notifications — My Recipe Book" };

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  return <NotificationsPageClient />;
}
