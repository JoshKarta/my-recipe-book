import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
// import { admin as adminPlugin, organization } from "better-auth/plugins";
// import { ac, admin, user, manager } from "@/lib/auth/permissions";

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
    // adminPlugin({
    //   ac,
    //   roles: {
    //     admin,
    //     user,
    //     manager,
    //   },
    // }),
    // organization({
    //   // Allow users to create their own organizations
    //   allowUserToCreateOrganization: async (user) => {
    //     // Only admins and managers can create organizations
    //     return user.role === "admin" || user.role === "manager";
    //   },
    //   // Define organization member roles
    //   memberRoles: ["owner", "admin", "member", "analyst"],
    //   // Default role when inviting members
    //   defaultRole: "member",
    //   // Organization creation hook for custom logic
    //   creatorRole: "owner",
    // }),
  ],
});
