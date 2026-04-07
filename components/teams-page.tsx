"use client";

import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
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
  PencilIcon,
  UserPlusIcon,
  UserMinusIcon,
  Loader2Icon,
  UsersIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { CreateTeamModal } from "@/components/create-team-modal";

// ── Types inferred from better-auth organization plugin ──────────────────────
type OrgMember = {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; image?: string | null };
};

type FullOrg = {
  id: string;
  name: string;
  slug: string | null;
  metadata: string | null;
  members: OrgMember[];
};

// ── Hook: load all orgs the user belongs to ──────────────────────────────────
function useTeams() {
  const [orgs, setOrgs] = useState<FullOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: list } = await authClient.organization.listOrganizations();
      if (!list) {
        setOrgs([]);
        return;
      }

      const full = await Promise.all(
        list.map(async (o) => {
          const { data } = await authClient.organization.getFullOrganization({
            query: { organizationId: o.id },
          });
          return data as FullOrg | null;
        }),
      );
      setOrgs(full.filter(Boolean) as FullOrg[]);
    } catch {
      toast.error("Could not load teams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { orgs, loading, refresh, currentUserId: session?.user.id ?? "" };
}

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
  org: FullOrg;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
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
      onSaved();
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
function OrgCard({
  org,
  currentUserId,
  onRefresh,
}: {
  org: FullOrg;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currentMember = org.members.find((m) => m.userId === currentUserId);
  const isOwner = currentMember?.role === "owner";
  const isAdmin = isOwner || currentMember?.role === "admin";

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
      onRefresh();
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
      onRefresh();
    }
  }

  const description = (() => {
    try {
      return org.metadata ? JSON.parse(org.metadata).description : null;
    } catch {
      return null;
    }
  })();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UsersIcon className="size-4 text-primary" />
                {org.name}
                {isOwner && (
                  <Badge variant="secondary" className="text-[10px]">
                    Owner
                  </Badge>
                )}
                {!isOwner && isAdmin && (
                  <Badge variant="outline" className="text-[10px]">
                    Admin
                  </Badge>
                )}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-1.5 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setEditOpen(true)}
                  title="Edit team"
                >
                  <PencilIcon className="size-3.5" />
                </Button>
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
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Separator />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Members ({org.members.length})
          </p>
          <ul className="space-y-2">
            {org.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {m.role === "owner" && (
                    <ShieldCheckIcon className="size-3.5 text-primary shrink-0" />
                  )}
                  <span className="font-medium truncate">{m.user.name}</span>
                  <span className="text-muted-foreground truncate hidden sm:block">
                    {m.user.email}
                  </span>
                  {m.role !== "owner" && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {m.role}
                    </Badge>
                  )}
                </div>
                {isAdmin &&
                  m.userId !== currentUserId &&
                  m.role !== "owner" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                      title="Remove member"
                      disabled={removingId === m.id}
                      onClick={() => handleRemoveMember(m.id)}
                    >
                      {removingId === m.id ? (
                        <Loader2Icon className="size-3 animate-spin" />
                      ) : (
                        <UserMinusIcon className="size-3" />
                      )}
                    </Button>
                  )}
              </li>
            ))}
          </ul>
          {isAdmin && (
            <>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Invite
              </p>
              <p className="text-xs text-muted-foreground">
                Invitee will receive an in-app notification if they already have
                an account.
              </p>
              <InviteMemberForm orgId={org.id} onDone={onRefresh} />
            </>
          )}
        </CardContent>
      </Card>

      <EditOrgModal
        org={org}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onRefresh}
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
  const { orgs, loading, refresh, currentUserId } = useTeams();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Teams</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your teams, members, and invitations.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          New Team
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <UsersIcon className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No teams yet</p>
          <p className="text-sm mt-1">
            Create a team to start collaborating on recipes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <OrgCard
              key={org.id}
              org={org}
              currentUserId={currentUserId}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      <CreateTeamModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
