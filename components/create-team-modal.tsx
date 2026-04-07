"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusIcon, Trash2Icon, SendIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";

const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamModal({ open, onOpenChange }: CreateTeamModalProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "", description: "" },
  });

  function addInviteEmail() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (inviteEmails.includes(email)) {
      toast.error("This email has already been added");
      return;
    }
    setInviteEmails((prev) => [...prev, email]);
    setInviteEmail("");
  }

  function removeInviteEmail(email: string) {
    setInviteEmails((prev) => prev.filter((e) => e !== email));
  }

  async function onSubmit(values: CreateTeamValues) {
    setIsSubmitting(true);
    try {
      const slug = values.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const { data: org, error } = await authClient.organization.create({
        name: values.name,
        slug,
        metadata: values.description
          ? { description: values.description }
          : undefined,
      });

      if (error || !org) {
        toast.error(error?.message ?? "Failed to create team");
        return;
      }

      toast.success(`Team "${values.name}" created!`);

      // Send invitations
      if (inviteEmails.length > 0) {
        const inviteResults = await Promise.allSettled(
          inviteEmails.map((email) =>
            authClient.organization.inviteMember({
              organizationId: org.id,
              email,
              role: "member",
            }),
          ),
        );
        const failed = inviteResults.filter(
          (r) => r.status === "rejected",
        ).length;
        if (failed > 0) {
          toast.warning(`${failed} invitation(s) could not be sent`);
        } else {
          toast.success(`${inviteEmails.length} invitation(s) sent!`);
        }
      }

      form.reset();
      setInviteEmails([]);
      setInviteEmail("");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Team</DialogTitle>
          <DialogDescription>
            Set up a new team and invite members to collaborate on recipes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Family Recipes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What is this team for?"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Invite members */}
            <div className="space-y-2">
              <FormLabel>Invite Members</FormLabel>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInviteEmail();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addInviteEmail}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
              {inviteEmails.length > 0 && (
                <ul className="space-y-1">
                  {inviteEmails.map((email) => (
                    <li
                      key={email}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <SendIcon className="size-3 text-muted-foreground" />
                        {email}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeInviteEmail(email)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create Team"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
