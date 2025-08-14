import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  familyId: varchar("family_id").references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Families table
export const families = pgTable("families", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, in-progress, on-hold, complete
  assignedTo: text("assigned_to").notNull(), // "Me" or "Ana"
  eventId: varchar("event_id").references(() => events.id), // Link to events for event tasks
  category: text("category"), // For organizing tasks within events
  userId: varchar("user_id").notNull().references(() => users.id),
  familyId: varchar("family_id").references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lists table
export const lists = pgTable("lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"), // For grouping lists
  template: text("template"), // shopping, packing, task-checklist, custom
  userId: varchar("user_id").notNull().references(() => users.id),
  familyId: varchar("family_id").references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// List items table
export const listItems = pgTable("list_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listId: varchar("list_id").notNull().references(() => lists.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  quantity: text("quantity"),
  notes: text("notes"),
  category: text("category"), // For grouping items within lists
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar events table
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  color: text("color").default("#3b82f6"),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: text("recurring_pattern"), // daily, weekly, monthly, yearly
  userId: varchar("user_id").notNull().references(() => users.id),
  familyId: varchar("family_id").references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budget categories table
export const budgetCategories = pgTable("budget_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  monthlyLimit: decimal("monthly_limit", { precision: 10, scale: 2 }),
  color: text("color").default("#3b82f6"),
  userId: varchar("user_id").notNull().references(() => users.id),
  familyId: varchar("family_id").references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budget transactions table
export const budgetTransactions = pgTable("budget_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => budgetCategories.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // income, expense
  userId: varchar("user_id").notNull().references(() => users.id),
  familyId: varchar("family_id").references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  familyId: varchar("family_id").notNull().references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Devotional posts table
export const devotionalPosts = pgTable("devotional_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  reading: text("reading"),
  topic: text("topic"),
  questions: text("questions"),
  prayer: text("prayer"),
  date: timestamp("date").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  familyId: varchar("family_id").references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Devotional comments table
export const devotionalComments = pgTable("devotional_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => devotionalPosts.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events table (for event planning)
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  time: text("time"), // Store time separately for easier handling
  location: text("location"),
  template: text("template"), // birthday, wedding, meeting, custom
  userId: varchar("user_id").notNull().references(() => users.id),
  familyId: varchar("family_id").references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event guests table
export const eventGuests = pgTable("event_guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  rsvpStatus: text("rsvp_status").default("pending"), // attending, maybe, declined, pending
  createdAt: timestamp("created_at").defaultNow(),
});

// Event tasks table (replacing event checklists)
export const eventTasks = pgTable("event_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"), // For organizing tasks within the event
  assignedTo: text("assigned_to").notNull(), // "Me" or "Ana"
  completed: boolean("completed").default(false),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event budget table
export const eventBudget = pgTable("event_budget", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  item: text("item").notNull(),
  budgetedAmount: decimal("budgeted_amount", { precision: 10, scale: 2 }),
  actualAmount: decimal("actual_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mealie settings table
export const mealieSettings = pgTable("mealie_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  instanceUrl: text("instance_url").notNull(),
  apiKey: text("api_key").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertListSchema = createInsertSchema(lists).omit({
  id: true,
  createdAt: true,
});

export const insertListItemSchema = createInsertSchema(listItems).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetTransactionSchema = createInsertSchema(budgetTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertDevotionalPostSchema = createInsertSchema(devotionalPosts).omit({
  id: true,
  createdAt: true,
});

export const insertDevotionalCommentSchema = createInsertSchema(devotionalComments).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertEventTaskSchema = createInsertSchema(eventTasks).omit({
  id: true,
  createdAt: true,
});

export const insertEventGuestSchema = createInsertSchema(eventGuests).omit({
  id: true,
  createdAt: true,
});

export const insertEventBudgetSchema = createInsertSchema(eventBudget).omit({
  id: true,
  createdAt: true,
});

export const insertMealieSettingsSchema = createInsertSchema(mealieSettings).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type List = typeof lists.$inferSelect;
export type InsertList = z.infer<typeof insertListSchema>;
export type ListItem = typeof listItems.$inferSelect;
export type InsertListItem = z.infer<typeof insertListItemSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetTransaction = typeof budgetTransactions.$inferSelect;
export type InsertBudgetTransaction = z.infer<typeof insertBudgetTransactionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type DevotionalPost = typeof devotionalPosts.$inferSelect;
export type InsertDevotionalPost = z.infer<typeof insertDevotionalPostSchema>;
export type DevotionalComment = typeof devotionalComments.$inferSelect;
export type InsertDevotionalComment = z.infer<typeof insertDevotionalCommentSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventGuest = typeof eventGuests.$inferSelect;
export type InsertEventGuest = z.infer<typeof insertEventGuestSchema>;
export type EventTask = typeof eventTasks.$inferSelect;
export type InsertEventTask = z.infer<typeof insertEventTaskSchema>;
export type EventBudget = typeof eventBudget.$inferSelect;
export type InsertEventBudget = z.infer<typeof insertEventBudgetSchema>;
export type MealieSettings = typeof mealieSettings.$inferSelect;
export type InsertMealieSettings = z.infer<typeof insertMealieSettingsSchema>;
