import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit"]);
export const transactionCategoryEnum = pgEnum("transaction_category", [
  "item",
  "fees",
  "supply",
  "salary",
  "payment",
  "membership",
  "other",
]);
export const categoryTypeEnum = pgEnum("category_type", ["shop", "institute", "gym"]);
export const entityCategoryEnum = pgEnum("entity_category", [
  "customer",
  "supplier",
  "staff",
  "student",
  "member",
  "teacher",
  "trainer",
]);
export const staffRoleEnum = pgEnum("staff_role", ["teacher", "staff", "trainer"]);

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: categoryTypeEnum("type").notNull(),
    address: text("address").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("businesses_user_id_idx").on(table.userId),
    activeByUserIdx: index("businesses_active_by_user_idx").on(table.userId, table.deletedAt),
  }),
);

export const entities = pgTable(
  "entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    mobile: text("mobile").notNull(),
    address: text("address"),
    category: entityCategoryEnum("category").notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    reminderEnabled: boolean("reminder_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    businessIdIdx: index("entities_business_id_idx").on(table.businessId),
    categoryIdx: index("entities_category_idx").on(table.category),
  }),
);

export const entityTransactions = pgTable(
  "entity_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    category: transactionCategoryEnum("category").notNull(),
    title: text("title").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 2 }),
    unit: text("unit"),
    metadata: jsonb("metadata"),
    type: transactionTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    entityIdIdx: index("entity_transactions_entity_id_idx").on(table.entityId),
    createdAtIdx: index("entity_transactions_created_at_idx").on(table.createdAt),
    categoryIdx: index("entity_transactions_category_idx").on(table.category),
  }),
);

export const businessInventory = pgTable(
  "business_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    productName: text("product_name").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull().default("0"),
    unit: text("unit").notNull().default("pcs"),
    purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
    sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    businessIdIdx: index("business_inventory_business_id_idx").on(table.businessId),
  }),
);

export const supplierInventoryLinks = pgTable(
  "supplier_inventory_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    inventoryId: uuid("inventory_id")
      .notNull()
      .references(() => businessInventory.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    supplierInventoryUnique: index("supplier_inventory_unique_idx").on(table.supplierId, table.inventoryId),
  }),
);

export const entityStudentDetails = pgTable("entity_student_details", {
  entityId: uuid("entity_id")
    .primaryKey()
    .references(() => entities.id, { onDelete: "cascade" }),
  class: text("class").notNull(),
  rollNumber: text("roll_number").notNull(),
});

export const entityStaffDetails = pgTable("entity_staff_details", {
  entityId: uuid("entity_id")
    .primaryKey()
    .references(() => entities.id, { onDelete: "cascade" }),
  role: staffRoleEnum("role").notNull(),
  salary: numeric("salary", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const entityMemberDetails = pgTable("entity_member_details", {
  entityId: uuid("entity_id")
    .primaryKey()
    .references(() => entities.id, { onDelete: "cascade" }),
  membershipType: text("membership_type").notNull(),
  joiningDate: date("joining_date").notNull(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, {
    fields: [businesses.userId],
    references: [users.id],
  }),
  entities: many(entities),
  inventoryItems: many(businessInventory),
}));

export const entitiesRelations = relations(entities, ({ one, many }) => ({
  business: one(businesses, {
    fields: [entities.businessId],
    references: [businesses.id],
  }),
  transactions: many(entityTransactions),
  studentDetail: one(entityStudentDetails, {
    fields: [entities.id],
    references: [entityStudentDetails.entityId],
  }),
  staffDetail: one(entityStaffDetails, {
    fields: [entities.id],
    references: [entityStaffDetails.entityId],
  }),
  memberDetail: one(entityMemberDetails, {
    fields: [entities.id],
    references: [entityMemberDetails.entityId],
  }),
}));

export const entityTransactionsRelations = relations(entityTransactions, ({ one }) => ({
  entity: one(entities, {
    fields: [entityTransactions.entityId],
    references: [entities.id],
  }),
}));

export const businessInventoryRelations = relations(businessInventory, ({ one, many }) => ({
  business: one(businesses, {
    fields: [businessInventory.businessId],
    references: [businesses.id],
  }),
  supplierLinks: many(supplierInventoryLinks),
}));

export const supplierInventoryLinksRelations = relations(supplierInventoryLinks, ({ one }) => ({
  supplier: one(entities, {
    fields: [supplierInventoryLinks.supplierId],
    references: [entities.id],
  }),
  inventoryItem: one(businessInventory, {
    fields: [supplierInventoryLinks.inventoryId],
    references: [businessInventory.id],
  }),
}));

export const authUserRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const authSessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const authAccountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const schema = {
  users,
  businesses,
  entities,
  entityTransactions,
  businessInventory,
  supplierInventoryLinks,
  entityStudentDetails,
  entityStaffDetails,
  entityMemberDetails,
  user,
  session,
  account,
  verification,
  usersRelations,
  businessesRelations,
  entitiesRelations,
  entityTransactionsRelations,
  businessInventoryRelations,
  supplierInventoryLinksRelations,
  authUserRelations,
  authSessionRelations,
  authAccountRelations,
};
