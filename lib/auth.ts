import { db } from "@/db/drizzle";
import { notification, schema, user as userTable } from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";

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
        // Look up the invited user by email
        const invitedUser = await db
          .select({ id: userTable.id })
          .from(userTable)
          .where(eq(userTable.email, data.email))
          .limit(1)
          .then((rows) => rows[0] ?? null);

        // Only create a notification if the user already has an account
        if (!invitedUser) return;

        await db.insert(notification).values({
          id: crypto.randomUUID(),
          userId: invitedUser.id,
          type: "team_invitation",
          title: `Invitation to join ${data.organization.name}`,
          message: `${data.inviter.user.name} invited you to join the team "${data.organization.name}".`,
          data: JSON.stringify({
            invitationId: data.invitation.id,
            organizationId: data.organization.id,
            organizationName: data.organization.name,
            inviterName: data.inviter.user.name,
            role: data.invitation.role ?? "member",
          }),
          read: false,
        });
      },
    }),
  ],
});
