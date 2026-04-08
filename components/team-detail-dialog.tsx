"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2Icon,
  UserMinusIcon,
  ShieldCheckIcon,
  PlusIcon,
  Trash2Icon,
  SendIcon,
} from "lucide-react";

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

export interface TeamDetailDialogProps {
  orgId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function InviteSection({
  orgId,
  onDone,
}: {
  orgId: string;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function addEmail() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (emails.includes(trimmed)) {
      toast.error("This email has already been added");
      return;
    }
    setEmails((prev) => [...prev, trimmed]);
    setEmail("");
  }

  function removeEmail(e: string) {
    setEmails((prev) => prev.filter((x) => x !== e));
  }

  async function sendInvites() {
    if (emails.length === 0) return;
    setBusy(true);
    const results = await Promise.allSettled(
      emails.map((e) =>
        authClient.organization.inviteMember({
          organizationId: orgId,
          email: e,
          role: "member",
        }),
      ),
    );
    setBusy(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      toast.warning(`${failed} invitation(s) could not be sent`);
    } else {
      toast.success(
        `${emails.length} invitation(s) sent as in-app notification!`,
      );
    }
    setEmails([]);
    setEmail("");
    onDone();
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Invitees will receive an in-app notification to accept. They must
        already have an account.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="colleague@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addEmail();
            }
          }}
          className="text-sm"
        />
        <Button type="button" variant="outline" size="icon" onClick={addEmail}>
          <PlusIcon className="size-4" />
        </Button>
      </div>
      {emails.length > 0 && (
        <ul className="space-y-1">
          {emails.map((e) => (
            <li
              key={e}
              className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
            >
              <span className="flex items-center gap-2">
                <SendIcon className="size-3 text-muted-foreground" />
                {e}
              </span>
              <button
                type="button"
                onClick={() => removeEmail(e)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Button
        onClick={sendInvites}
        disabled={busy || emails.length === 0}
        className="w-full"
        size="sm"
      >
        {busy ? (
          <Loader2Icon className="size-3.5 mr-1.5 animate-spin" />
        ) : (
          <SendIcon className="size-3.5 mr-1.5" />
        )}
        Send {emails.length > 0 ? emails.length : ""} Invitation
        {emails.length !== 1 ? "s" : ""}
      </Button>
    </div>
  );
}

export function TeamDetailDialog({
  orgId,
  open,
  onOpenChange,
}: TeamDetailDialogProps) {
  const [org, setOrg] = useState<FullOrg | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeMemberTarget, setRemoveMemberTarget] =
    useState<OrgMember | null>(null);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user.id ?? "";

  const loadOrg = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await authClient.organization.getFullOrganization({
      query: { organizationId: orgId },
    });
    setOrg(data as FullOrg | null);
    if (data) setEditName(data.name);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    if (open && orgId) loadOrg();
    else if (!open) setOrg(null);
  }, [open, orgId, loadOrg]);

  const currentMember = org?.members.find((m) => m.userId === currentUserId);
  const isOwner = currentMember?.role === "owner";
  const isAdmin = isOwner || currentMember?.role === "admin";

  async function handleRemove() {
    if (!org || !removeMemberTarget) return;
    setRemovingId(removeMemberTarget.id);
    setRemoveMemberTarget(null);
    const { error } = await authClient.organization.removeMember({
      organizationId: org.id,
      memberIdOrEmail: removeMemberTarget.id,
    });
    setRemovingId(null);
    if (error) {
      toast.error(error.message ?? "Failed to remove member");
    } else {
      toast.success("Member removed.");
      loadOrg();
    }
  }

  async function handleSaveName() {
    if (!org || !editName.trim() || editName.trim() === org.name) return;
    setSavingName(true);
    const { error } = await authClient.organization.update({
      organizationId: org.id,
      data: { name: editName.trim() },
    });
    setSavingName(false);
    if (error) {
      toast.error(error.message ?? "Failed to update team name");
    } else {
      toast.success("Team name updated!");
      loadOrg();
    }
  }

  async function handleDelete() {
    if (!org) return;
    setDeleting(true);
    const { error } = await authClient.organization.delete({
      organizationId: org.id,
    });
    setDeleting(false);
    if (error) {
      toast.error(error.message ?? "Failed to delete team");
    } else {
      toast.success(`Team "${org.name}" deleted.`);
      setDeleteOpen(false);
      onOpenChange(false);
    }
  }

  const description = (() => {
    try {
      return org?.metadata ? JSON.parse(org.metadata).description : null;
    } catch {
      return null;
    }
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {loading && !org ? "Loading…" : (org?.name ?? "Team")}
            </DialogTitle>
            {(description || org?.slug) && (
              <DialogDescription>
                {description ?? `slug: ${org?.slug}`}
              </DialogDescription>
            )}
          </DialogHeader>

          {loading && !org ? (
            <div className="flex justify-center py-10">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : org ? (
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="members" className="flex-1">
                  Members ({org.members.length})
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="invite" className="flex-1">
                    Invite
                  </TabsTrigger>
                )}
                {isOwner && (
                  <TabsTrigger value="settings" className="flex-1">
                    Settings
                  </TabsTrigger>
                )}
              </TabsList>

              {/* ── Members tab ── */}
              <TabsContent value="members" className="mt-4">
                <ul className="space-y-2">
                  {org.members.map((m) => (
                    <>
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {m.role === "owner" && (
                            <ShieldCheckIcon className="size-3.5 text-primary shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {m.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {m.user.email}
                            </p>
                          </div>
                          {m.role !== "owner" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0 capitalize"
                            >
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
                              onClick={() => setRemoveMemberTarget(m)}
                            >
                              {removingId === m.id ? (
                                <Loader2Icon className="size-3 animate-spin" />
                              ) : (
                                <UserMinusIcon className="size-3" />
                              )}
                            </Button>
                          )}
                      </li>

                      <Separator />
                    </>
                  ))}
                </ul>
              </TabsContent>

              {/* ── Invite tab ── */}
              {isAdmin && (
                <TabsContent value="invite" className="mt-4">
                  <InviteSection orgId={org.id} onDone={loadOrg} />
                </TabsContent>
              )}

              {/* ── Settings tab ── */}
              {isOwner && (
                <TabsContent value="settings" className="mt-4 space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Team Name
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                        className="text-sm"
                      />
                      <Button
                        onClick={handleSaveName}
                        disabled={
                          savingName ||
                          !editName.trim() ||
                          editName.trim() === org.name
                        }
                        size="sm"
                      >
                        {savingName ? (
                          <Loader2Icon className="size-3.5 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Danger Zone
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete this team and remove all members. This
                      action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2Icon className="size-3.5 mr-1.5" />
                      Delete Team
                    </Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Could not load team details.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!removeMemberTarget}
        onOpenChange={(v) => !v && setRemoveMemberTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove &quot;{removeMemberTarget?.user.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removeMemberTarget?.user.name} will lose access to this team
              immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleRemove}
              disabled={!!removingId}
            >
              {removingId && (
                <Loader2Icon className="size-3.5 mr-1 animate-spin" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{org?.name}&quot;?</AlertDialogTitle>
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
