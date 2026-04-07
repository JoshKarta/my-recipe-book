"use client";

import { useCallback, useEffect, useState } from "react";
import { BellIcon, CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: string | null;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const dismiss = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, loading, refresh, markRead, dismiss };
}

interface InviteData {
  invitationId: string;
  organizationName: string;
  inviterName: string;
  role: string;
}

function NotificationItem({
  notif,
  onMarkRead,
  onDismiss,
  onRefresh,
}: {
  notif: AppNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onRefresh: () => void;
}) {
  const isInvite = notif.type === "team_invitation";
  const timeAgo = new Date(notif.createdAt).toLocaleDateString();

  return (
    <div
      className={cn("px-4 py-3 group relative", !notif.read && "bg-primary/5")}
    >
      <button
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
        onClick={() => onDismiss(notif.id)}
        title="Dismiss"
      >
        <XIcon className="size-3.5" />
      </button>
      <div className="flex items-start gap-2 pr-5">
        {!notif.read && (
          <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium leading-snug",
              notif.read && "pl-3.5",
            )}
          >
            {notif.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {notif.message}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo}</p>
          {isInvite && (
            <InvitationActions
              notif={notif}
              onDone={() => {
                onDismiss(notif.id);
                onRefresh();
              }}
            />
          )}
          {!notif.read && !isInvite && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground mt-1.5 underline underline-offset-2"
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

export function NotificationsDropdown() {
  const { notifications, loading, refresh, markRead, dismiss } =
    useNotifications();
  const unread = notifications.filter((n) => !n.read).length;
  const preview = notifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <BellIcon className="size-4" />
          {unread > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 size-4 p-0 text-[10px] flex items-center justify-center rounded-full">
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unread > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unread} new
            </Badge>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto divide-y">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : preview.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notifications yet.
            </p>
          ) : (
            preview.map((n) => (
              <NotificationItem
                key={n.id}
                notif={n}
                onMarkRead={markRead}
                onDismiss={dismiss}
                onRefresh={refresh}
              />
            ))
          )}
        </div>
        <Separator />
        <div className="px-4 py-2.5">
          <Link
            href="/notifications"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InvitationActions({
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
    if (error) {
      toast.error(error.message ?? "Failed to accept");
    } else {
      toast.success(`Joined ${parsed.organizationName}!`);
      onDone();
    }
    setBusy(null);
  }

  async function decline() {
    setBusy("decline");
    const { error } = await authClient.organization.rejectInvitation({
      invitationId: parsed.invitationId,
    });
    if (error) {
      toast.error(error.message ?? "Failed to decline");
    } else {
      toast.info("Invitation declined.");
      onDone();
    }
    setBusy(null);
  }

  return (
    <div className="flex gap-1.5 mt-2">
      <Button
        size="sm"
        className="h-7 text-xs px-3"
        onClick={accept}
        disabled={!!busy}
      >
        {busy === "accept" ? (
          <Loader2Icon className="size-3 animate-spin" />
        ) : (
          <CheckIcon className="size-3" />
        )}
        Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs px-3"
        onClick={decline}
        disabled={!!busy}
      >
        {busy === "decline" ? (
          <Loader2Icon className="size-3 animate-spin" />
        ) : (
          <XIcon className="size-3" />
        )}
        Decline
      </Button>
    </div>
  );
}
