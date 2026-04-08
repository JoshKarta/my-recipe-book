"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2Icon,
  UsersIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { CreateTeamModal } from "@/components/create-team-modal";
import { TeamDetailDialog } from "@/components/team-detail-dialog";
import { Organization } from "better-auth/plugins";
import { useRouter } from "next/navigation";

// ── Single org card ───────────────────────────────────────────────────────────
function OrgCard({ org, isOwner }: { org: Organization; isOwner: boolean }) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setDetailOpen(true)}
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UsersIcon className="size-4 text-primary" />
                {org?.name}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                slug: {org?.slug}
                {isOwner && (
                  <span className="ml-2 text-primary font-medium">· Owner</span>
                )}
              </CardDescription>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
          </div>
        </CardHeader>
      </Card>

      <TeamDetailDialog
        orgId={org.id}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}

// ── Main page component ───────────────────────────────────────────────────────
export function TeamsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: organizations } = authClient.useListOrganizations();
  const [orgRoles, setOrgRoles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { data: session } = authClient.useSession();
  const router = useRouter();

  console.log(organizations);
  console.log(orgRoles);

  useEffect(() => {
    if (!organizations || !session?.user?.id) return;

    async function fetchRoles() {
      try {
        setIsLoading(true);
        const roles: Record<string, string> = {};
        await Promise.all(
          organizations!.map(async (org) => {
            const { data } = await authClient.organization.getFullOrganization({
              query: { organizationId: org.id },
            });
            const me = data?.members.find((m) => m.userId === session!.user.id);
            if (me) roles[org.id] = me.role;
          }),
        );
        setOrgRoles(roles);
      } catch (error) {
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoles();
  }, [organizations, session?.user?.id]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Teams</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your teams, members, and invitations.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            onClick={() => router.back()}
            size={"icon"}
            variant={"secondary"}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            New Team
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : !organizations ? (
        <div className="text-center py-20 text-muted-foreground">
          <UsersIcon className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No teams yet</p>
          <p className="text-sm mt-1">
            Create a team to start collaborating on recipes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {organizations?.map((org) => (
            <OrgCard
              key={org.id}
              org={org}
              isOwner={orgRoles[org.id] === "owner"}
            />
          ))}
        </div>
      )}
      <CreateTeamModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
