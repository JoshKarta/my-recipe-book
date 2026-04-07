"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChefHatIcon, UsersIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";

type InvitationStatus = "loading" | "valid" | "accepted" | "error";

interface InvitationDetails {
  organizationName: string;
  inviterName: string;
  email: string;
}

export default function AcceptInvitationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      // Redirect to sign in, then come back
      router.push(`/signin?redirect=/accept-invitation/${id}`);
      return;
    }

    async function loadInvitation() {
      try {
        const { data, error } = await authClient.organization.getInvitation({
          query: { id },
        });
        if (error || !data) {
          setErrorMessage(error?.message ?? "Invitation not found or expired.");
          setStatus("error");
          return;
        }
        setInvitation({
          organizationName: data.organizationName,
          inviterName: data.inviterName ?? "A team member",
          email: data.email,
        });
        setStatus("valid");
      } catch {
        setErrorMessage("Could not load invitation details.");
        setStatus("error");
      }
    }

    loadInvitation();
  }, [id, session, sessionLoading, router]);

  async function handleAccept() {
    setIsAccepting(true);
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId: id,
      });
      if (error) {
        toast.error(error.message ?? "Failed to accept invitation");
        return;
      }
      toast.success(`You've joined ${invitation?.organizationName}!`);
      setStatus("accepted");
      setTimeout(() => router.push("/"), 2000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleDecline() {
    try {
      await authClient.organization.rejectInvitation({ invitationId: id });
      toast.info("Invitation declined.");
      router.push("/");
    } catch {
      toast.error("Could not decline the invitation.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
        <ChefHatIcon className="size-7 text-primary" />
        <span className="text-xl font-semibold">My Recipe Book</span>
      </Link>

      <Card className="w-full max-w-md">
        {status === "loading" && (
          <>
            <CardHeader>
              <CardTitle>Loading invitation…</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
            </CardContent>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader>
              <CardTitle>Invitation unavailable</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/">Back to Home</Link>
              </Button>
            </CardFooter>
          </>
        )}

        {status === "accepted" && (
          <>
            <CardHeader>
              <CardTitle>You&apos;re in! 🎉</CardTitle>
              <CardDescription>
                You&apos;ve successfully joined <strong>{invitation?.organizationName}</strong>. Redirecting you home…
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </CardContent>
          </>
        )}

        {status === "valid" && invitation && (
          <>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UsersIcon className="size-5 text-primary" />
                </div>
                <CardTitle>You&apos;re invited!</CardTitle>
              </div>
              <CardDescription>
                <strong>{invitation.inviterName}</strong> has invited you to join the team{" "}
                <strong>{invitation.organizationName}</strong> on My Recipe Book.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This invitation was sent to <span className="font-medium text-foreground">{invitation.email}</span>.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDecline}
                disabled={isAccepting}
              >
                Decline
              </Button>
              <Button
                className="flex-1"
                onClick={handleAccept}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <><Loader2Icon className="size-4 mr-2 animate-spin" /> Joining…</>
                ) : (
                  "Accept & Join"
                )}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
