import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const partyTypeEnum = pgEnum("party_type", ["customer", "student", "member"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit"]);
export const categoryTypeEnum = pgEnum("category_type", ["shop", "institute", "gym"]);
export const supplierTransactionTypeEnum = pgEnum("supplier_transaction_type", ["given", "taken"]);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: categoryTypeEnum("type").notNull(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("categories_user_id_idx").on(table.userId),
    activeByUserIdx: index("categories_active_by_user_idx").on(table.userId, table.deletedAt),
  }),
);

export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  type: partyTypeEnum("type").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studentDetails = pgTable("student_details", {
  id: serial("id").primaryKey(),
  partyId: integer("party_id")
    .notNull()
    .unique()
    .references(() => parties.id, { onDelete: "cascade" }),
  class: text("class").notNull(),
  rollNumber: text("roll_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  partyId: integer("party_id")
    .notNull()
    .references(() => parties.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  title: text("title").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  partyId: integer("party_id")
    .notNull()
    .references(() => parties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull().default("pcs"),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const supplierTransactions = pgTable("supplier_transactions", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: supplierTransactionTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  role: text("role").notNull(),
  salary: numeric("salary", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const staffSalaryLogs = pgTable("staff_salary_logs", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  parties: many(parties),
}));

export const partiesRelations = relations(parties, ({ one, many }) => ({
  category: one(categories, {
    fields: [parties.categoryId],
    references: [categories.id],
  }),
  studentDetail: one(studentDetails, {
    fields: [parties.id],
    references: [studentDetails.partyId],
  }),
  transactions: many(transactions),
  items: many(items),
}));

export const studentDetailsRelations = relations(studentDetails, ({ one }) => ({
  party: one(parties, {
    fields: [studentDetails.partyId],
    references: [parties.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  party: one(parties, {
    fields: [transactions.partyId],
    references: [parties.id],
  }),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  party: one(parties, {
    fields: [items.partyId],
    references: [parties.id],
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
  categories,
  parties,
  studentDetails,
  transactions,
  items,
  inventory,
  suppliers,
  supplierTransactions,
  staff,
  staffSalaryLogs,
  user,
  session,
  account,
  verification,
  usersRelations,
  categoriesRelations,
  partiesRelations,
  studentDetailsRelations,
  transactionsRelations,
  itemsRelations,
  authUserRelations,
  authSessionRelations,
  authAccountRelations,
};
