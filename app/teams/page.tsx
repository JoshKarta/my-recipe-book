import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TeamsPage } from "@/components/teams-page";

export const metadata = { title: "Teams — My Recipe Book" };

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  return <TeamsPage />;
}
