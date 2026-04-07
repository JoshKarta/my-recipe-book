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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2Icon,
  UserMinusIcon,
  UserPlusIcon,
  ShieldCheckIcon,
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
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    const { error } = await authClient.organization.inviteMember({
      organizationId: orgId,
      email: trimmed,
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
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Invite Member
      </p>
      <p className="text-xs text-muted-foreground">
        They must have an account — they&apos;ll receive an in-app notification.
      </p>
      <form onSubmit={handleInvite} className="flex gap-2 pt-1">
        <Input
          type="email"
          placeholder="colleague@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={busy}
          className="h-8 shrink-0"
        >
          {busy ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <UserPlusIcon className="size-3.5" />
          )}
          Invite
        </Button>
      </form>
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
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user.id ?? "";

  const loadOrg = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await authClient.organization.getFullOrganization({
      query: { organizationId: orgId },
    });
    setOrg(data as FullOrg | null);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    if (open && orgId) loadOrg();
    else if (!open) setOrg(null);
  }, [open, orgId, loadOrg]);

  const currentMember = org?.members.find((m) => m.userId === currentUserId);
  const isOwner = currentMember?.role === "owner";
  const isAdmin = isOwner || currentMember?.role === "admin";

  async function handleRemove(memberId: string) {
    if (!org) return;
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
      loadOrg();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {loading && !org ? "Loading…" : (org?.name ?? "Team")}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {loading && !org ? (
          <div className="flex justify-center py-10">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : org ? (
          <div className="space-y-4">
            {/* Members list */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
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
                      <div className="min-w-0">
                        <p className="font-medium truncate">{m.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.user.email}
                        </p>
                      </div>
                      {m.role !== "owner" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0"
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
                          onClick={() => handleRemove(m.id)}
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
            </div>

            {/* Invite form — admins and owners only */}
            {isAdmin && (
              <>
                <Separator />
                <InviteMemberForm orgId={org.id} onDone={loadOrg} />
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8 text-sm">
            Could not load team details.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
