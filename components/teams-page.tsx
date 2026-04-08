"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2Icon,
  UserPlusIcon,
  Loader2Icon,
  UsersIcon,
  PlusIcon,
  ChevronLeftIcon,
} from "lucide-react";
import { CreateTeamModal } from "@/components/create-team-modal";
import { Organization } from "better-auth/plugins";
import { useRouter } from "next/navigation";

// ── Invite member form ────────────────────────────────────────────────────────
function InviteMemberForm({
  orgId,
  onDone,
}: {
  orgId: string;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await authClient.organization.inviteMember({
      organizationId: orgId,
      email: email.trim(),
      role: "member",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? "Failed to send invitation");
    } else {
      toast.success("Invitation sent as in-app notification!");
      setEmail("");
      onDone();
    }
  }

  return (
    <form onSubmit={handleInvite} className="flex gap-2 mt-3">
      <Input
        type="email"
        placeholder="Invite by email…"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-8 text-sm"
      />
      <Button type="submit" size="sm" disabled={busy} className="h-8">
        {busy ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <UserPlusIcon className="size-3.5" />
        )}
        <span className="hidden sm:inline">Invite</span>
      </Button>
    </form>
  );
}

// ── Edit org name modal ───────────────────────────────────────────────────────
function EditOrgModal({
  org,
  open,
  onOpenChange,
  onSaved,
}: {
  org: Organization;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}) {
  const [name, setName] = useState(org.name);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(org.name);
  }, [org.name]);

  async function save() {
    if (!name.trim() || name === org.name) {
      onOpenChange(false);
      return;
    }
    setBusy(true);
    const { error } = await authClient.organization.update({
      organizationId: org.id,
      data: { name: name.trim() },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? "Failed to update team");
    } else {
      toast.success("Team updated!");
      // onSaved();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="Team name"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2Icon className="size-3.5 mr-1 animate-spin" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Single org card ───────────────────────────────────────────────────────────
function OrgCard({ org, isOwner }: { org: Organization; isOwner: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const { error } = await authClient.organization.delete({
      organizationId: org.id,
    });
    setDeleting(false);
    if (error) {
      toast.error(error.message ?? "Failed to delete team");
    } else {
      toast.success(`Team "${org.name}" deleted.`);
      // onRefresh();
    }
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingId(memberId);
    const { error } = await authClient.organization.removeMember({
      organizationId: org.id,
      memberIdOrEmail: memberId,
    });
    setRemovingId(null);
    if (error) {
      toast.error(error.message ?? "Failed to remove member");
    } else {
      toast.success("Member removed.");
      // onRefresh();
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UsersIcon className="size-4 text-primary" />
                {org?.name}
                {/* {isOwner && (
                  <Badge variant="secondary" className="text-[10px]">
                    Owner
                  </Badge>
                )}
                {!isOwner && isAdmin && (
                  <Badge variant="outline" className="text-[10px]">
                    Admin
                  </Badge>
                )} */}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                slug: {org?.slug}
              </CardDescription>
            </div>
            {isOwner && (
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
                title="Delete team"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <EditOrgModal
        org={org}
        open={editOpen}
        onOpenChange={setEditOpen}
        // onSaved={onRefresh}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{org.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the team and remove all members. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && (
                <Loader2Icon className="size-3.5 mr-1 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
              // onRefresh={() => {
              //   /* trigger refetch */
              // }}
            />
          ))}
        </div>
      )}
      <CreateTeamModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
