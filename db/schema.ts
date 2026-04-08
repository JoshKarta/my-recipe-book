import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
    activeTeamId: text("active_team_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const notification = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    data: text("data"), // JSON string
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("notification_userId_idx").on(table.userId)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  notifications: many(notification),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("createdAt").notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));

// ─── Recipes ─────────────────────────────────────────────────────────────────

export const recipe = pgTable(
  "recipe",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    ingredients: text("ingredients").notNull(),
    instructions: text("instructions").notNull(),
    cookingTime: text("cooking_time"),
    servings: text("servings"),
    rating: integer("rating").default(0).notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("recipe_createdById_idx").on(table.createdById),
    index("recipe_organizationId_idx").on(table.organizationId),
  ],
);

export const recipeImage = pgTable(
  "recipe_image",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    order: integer("order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("recipe_image_recipeId_idx").on(table.recipeId)],
);

// ─── Meal Plans ───────────────────────────────────────────────────────────────

export const mealPlan = pgTable(
  "meal_plan",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(), // YYYY-MM-DD
    mealType: text("meal_type").notNull(), // breakfast | lunch | dinner
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meal_plan_createdById_idx").on(table.createdById),
    index("meal_plan_organizationId_idx").on(table.organizationId),
    uniqueIndex("meal_plan_date_mealType_org_idx").on(
      table.date,
      table.mealType,
      table.organizationId,
    ),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const recipeRelations = relations(recipe, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [recipe.createdById],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [recipe.organizationId],
    references: [organization.id],
  }),
  images: many(recipeImage),
  mealPlans: many(mealPlan),
}));

export const recipeImageRelations = relations(recipeImage, ({ one }) => ({
  recipe: one(recipe, {
    fields: [recipeImage.recipeId],
    references: [recipe.id],
  }),
}));

export const mealPlanRelations = relations(mealPlan, ({ one }) => ({
  recipe: one(recipe, {
    fields: [mealPlan.recipeId],
    references: [recipe.id],
  }),
  createdBy: one(user, {
    fields: [mealPlan.createdById],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [mealPlan.organizationId],
    references: [organization.id],
  }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  notification,
  recipe,
  recipeImage,
  mealPlan,
};
