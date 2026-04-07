"use client";

import { BellIcon, CheckCheckIcon, Loader2Icon, XIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useState } from "react";
import {
  useNotifications,
  type AppNotification,
} from "@/components/notifications-dropdown";

interface InviteData {
  invitationId: string;
  organizationName: string;
  inviterName: string;
  role: string;
}

function InviteActions({
  notif,
  onDone,
}: {
  notif: AppNotification;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const parsed: InviteData = JSON.parse(notif.data ?? "{}");

  async function accept() {
    setBusy("accept");
    const { error } = await authClient.organization.acceptInvitation({
      invitationId: parsed.invitationId,
    });
    if (error) { toast.error(error.message ?? "Failed to accept"); }
    else { toast.success(`Joined ${parsed.organizationName}!`); onDone(); }
    setBusy(null);
  }

  async function decline() {
    setBusy("decline");
    const { error } = await authClient.organization.rejectInvitation({
      invitationId: parsed.invitationId,
    });
    if (error) { toast.error(error.message ?? "Failed to decline"); }
    else { toast.info("Invitation declined."); onDone(); }
    setBusy(null);
  }

  return (
    <div className="flex gap-2 mt-3">
      <Button size="sm" onClick={accept} disabled={!!busy}>
        {busy === "accept" ? <Loader2Icon className="size-3.5 mr-1 animate-spin" /> : <CheckIcon className="size-3.5 mr-1" />}
        Accept
      </Button>
      <Button size="sm" variant="outline" onClick={decline} disabled={!!busy}>
        {busy === "decline" ? <Loader2Icon className="size-3.5 mr-1 animate-spin" /> : <XIcon className="size-3.5 mr-1" />}
        Decline
      </Button>
    </div>
  );
}

function NotifRow({ notif, onMarkRead, onDismiss, onRefresh }: {
  notif: AppNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onRefresh: () => void;
}) {
  const isInvite = notif.type === "team_invitation";

  return (
    <div className={cn("rounded-lg border p-4 relative group", !notif.read && "bg-primary/5 border-primary/20")}>
      <button
        onClick={() => onDismiss(notif.id)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        title="Dismiss"
      >
        <XIcon className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        {!notif.read && <span className="mt-2 size-2 rounded-full bg-primary shrink-0" />}
        <div className={cn("flex-1 min-w-0", notif.read && "pl-5")}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{notif.title}</p>
            {!notif.read && <Badge className="text-[10px]">New</Badge>}
            {isInvite && <Badge variant="secondary" className="text-[10px]">Invitation</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {new Date(notif.createdAt).toLocaleString()}
          </p>
          {isInvite && (
            <InviteActions notif={notif} onDone={() => { onDismiss(notif.id); onRefresh(); }} />
          )}
          {!notif.read && !isInvite && (
            <button
              className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground mt-2"
              onClick={() => onMarkRead(notif.id)}
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationsPageClient() {
  const { notifications, loading, refresh, markRead, dismiss } = useNotifications();
  const unread = notifications.filter((n) => !n.read);

  async function markAllRead() {
    await Promise.all(unread.map((n) => fetch(`/api/notifications/${n.id}`, { method: "PATCH" })));
    refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BellIcon className="size-6" /> Notifications
          </h1>
          {unread.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unread.length} unread</p>
          )}
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheckIcon className="size-4 mr-1.5" /> Mark all read
          </Button>
        )}
      </div>

      <Separator />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BellIcon className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">You&apos;re all caught up!</p>
          <p className="text-sm mt-1">No notifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotifRow key={n.id} notif={n} onMarkRead={markRead} onDismiss={dismiss} onRefresh={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
