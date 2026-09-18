import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const skillLevelEnum = pgEnum("skill_level", [
  "beginner",
  "elementary",
  "intermediate",
  "advanced",
  "custom",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "completed",
  "cancelled",
  "rescheduled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "waived",
]);

export const recurrenceTypeEnum = pgEnum("recurrence_type", [
  "none",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
]);

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Custom Skill Levels ──────────────────────────────────────────────────────

export const customLevels = pgTable("custom_levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  color: text("color").notNull().default("#6366f1"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Children ─────────────────────────────────────────────────────────────────

export const children = pgTable("children", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  fullNameAr: text("full_name_ar"),
  age: integer("age"),
  dateOfBirth: text("date_of_birth"), // stored as ISO string
  skillLevel: text("skill_level").notNull().default("beginner"),
  customLevelId: uuid("custom_level_id").references(() => customLevels.id, {
    onDelete: "set null",
  }),
  avatarColor: text("avatar_color").notNull().default("#f59e0b"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Parents / Contacts ───────────────────────────────────────────────────────

export const parents = pgTable("parents", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  phone: text("phone").notNull(), // WhatsApp number (international format)
  relationship: text("relationship").notNull().default("parent"), // parent, guardian, etc.
  homeAddress: text("home_address"),
  locationNotes: text("location_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  status: sessionStatusEnum("status").notNull().default("scheduled"),
  address: text("address"),
  locationNotes: text("location_notes"),

  // Payment
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
  sessionPrice: decimal("session_price", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("EGP"),

  // Recurrence
  recurrenceType: recurrenceTypeEnum("recurrence_type")
    .notNull()
    .default("none"),
  recurrenceGroupId: uuid("recurrence_group_id"),
  isRecurrenceException: boolean("is_recurrence_exception")
    .notNull()
    .default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Session Notes / Logs ─────────────────────────────────────────────────────

export const sessionNotes = pgTable("session_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),

  // Structured fields
  topicsCovered: text("topics_covered"),
  topicsPending: text("topics_pending"),
  strengths: jsonb("strengths").$type<string[]>().default([]),
  strengthsText: text("strengths_text"),
  weaknesses: jsonb("weaknesses").$type<string[]>().default([]),
  weaknessesText: text("weaknesses_text"),
  nextSessionFocus: text("next_session_focus"),
  reviewItems: text("review_items"),
  freeNotes: text("free_notes"),

  // Quick tags
  strengthTags: jsonb("strength_tags").$type<string[]>().default([]),
  weaknessTags: jsonb("weakness_tags").$type<string[]>().default([]),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── WhatsApp Message Templates ───────────────────────────────────────────────

export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  template: text("template").notNull(),
  templateAr: text("template_ar"),
  category: text("category").notNull().default("general"), // reminder, update, rescheduling
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const childrenRelations = relations(children, ({ many, one }) => ({
  parents: many(parents),
  sessions: many(sessions),
  sessionNotes: many(sessionNotes),
  customLevel: one(customLevels, {
    fields: [children.customLevelId],
    references: [customLevels.id],
  }),
}));

export const parentsRelations = relations(parents, ({ one }) => ({
  child: one(children, {
    fields: [parents.childId],
    references: [children.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  child: one(children, {
    fields: [sessions.childId],
    references: [children.id],
  }),
  notes: many(sessionNotes),
}));

export const sessionNotesRelations = relations(sessionNotes, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionNotes.sessionId],
    references: [sessions.id],
  }),
  child: one(children, {
    fields: [sessionNotes.childId],
    references: [children.id],
  }),
}));

export const customLevelsRelations = relations(customLevels, ({ many }) => ({
  children: many(children),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Child = typeof children.$inferSelect;
export type NewChild = typeof children.$inferInsert;
export type Parent = typeof parents.$inferSelect;
export type NewParent = typeof parents.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionNote = typeof sessionNotes.$inferSelect;
export type NewSessionNote = typeof sessionNotes.$inferInsert;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type NewMessageTemplate = typeof messageTemplates.$inferInsert;
export type CustomLevel = typeof customLevels.$inferSelect;
export type NewCustomLevel = typeof customLevels.$inferInsert;
export type Setting = typeof settings.$inferSelect;
