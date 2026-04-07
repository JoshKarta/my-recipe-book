import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  plugins: [
    nextCookies(),
    organization({
      async sendInvitationEmail(data) {
        const inviteUrl = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.invitation.id}`;
        await resend.emails.send({
          from: "My Recipe Book <noreply@yourdomain.com>",
          to: data.email,
          subject: `You've been invited to join ${data.organization.name} on My Recipe Book`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You're invited!</h2>
              <p><strong>${data.inviter.user.name}</strong> has invited you to join the team <strong>${data.organization.name}</strong> on My Recipe Book.</p>
              <p>Click the button below to accept the invitation:</p>
              <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
                Accept Invitation
              </a>
              <p style="margin-top:24px;color:#666;font-size:14px;">This invitation will expire in 48 hours. If you did not expect this invitation, you can safely ignore this email.</p>
            </div>
          `,
        });
      },
    }),
  ],
});
