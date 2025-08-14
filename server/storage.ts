import { eq, and, desc, sql, or } from "drizzle-orm";
import { db } from "./db";
import { 
  users, families, tasks, lists, listItems, calendarEvents, budgetCategories,
  budgetTransactions, chatMessages, devotionalPosts, devotionalComments, events,
  eventTasks, eventBudget, mealieSettings, recipes, mealPlans, emojiReactions,
  User, InsertUser, Family, InsertFamily, Task, InsertTask, List, InsertList, 
  ListItem, InsertListItem, CalendarEvent, InsertCalendarEvent, BudgetCategory, 
  InsertBudgetCategory, BudgetTransaction, InsertBudgetTransaction, ChatMessage, 
  InsertChatMessage, DevotionalPost, InsertDevotionalPost, DevotionalComment, 
  InsertDevotionalComment, Event, InsertEvent, EventTask, InsertEventTask, 
  EventBudget, InsertEventBudget, MealieSettings, InsertMealieSettings, Recipe, 
  InsertRecipe, MealPlan, InsertMealPlan, EmojiReaction, InsertEmojiReaction
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;

  // Family methods
  getFamily(id: string): Promise<Family | undefined>;
  getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined>;
  createFamily(insertFamily: InsertFamily): Promise<Family>;
  joinFamily(userId: string, familyId: string): Promise<boolean>;

  // Task methods
  getTasks(userId: string, familyId?: string): Promise<Task[]>;
  createTask(insertTask: InsertTask): Promise<Task>;
  updateTask(id: string, taskData: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // List methods
  getLists(userId: string, familyId?: string): Promise<List[]>;
  createList(insertList: InsertList): Promise<List>;
  updateList(id: string, listData: Partial<List>): Promise<List | undefined>;
  deleteList(id: string): Promise<boolean>;

  // List item methods
  getListItems(listId: string): Promise<ListItem[]>;
  createListItem(insertListItem: InsertListItem): Promise<ListItem>;
  updateListItem(id: string, itemData: Partial<ListItem>): Promise<ListItem | undefined>;
  deleteListItem(id: string): Promise<boolean>;

  // Calendar event methods
  getCalendarEvents(userId: string, familyId?: string): Promise<CalendarEvent[]>;
  createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;

  // Budget category methods
  getBudgetCategories(userId: string, familyId?: string): Promise<BudgetCategory[]>;
  createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: string, categoryData: Partial<BudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: string): Promise<boolean>;

  // Budget transaction methods
  getBudgetTransactions(userId: string, familyId?: string): Promise<BudgetTransaction[]>;
  createBudgetTransaction(insertTransaction: InsertBudgetTransaction): Promise<BudgetTransaction>;
  updateBudgetTransaction(id: string, transactionData: Partial<BudgetTransaction>): Promise<BudgetTransaction | undefined>;
  deleteBudgetTransaction(id: string): Promise<boolean>;

  // Chat methods
  getChatMessages(familyId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage>;

  // Devotional methods
  getDevotionalPosts(userId: string, familyId?: string): Promise<DevotionalPost[]>;
  createDevotionalPost(insertPost: InsertDevotionalPost): Promise<DevotionalPost>;
  updateDevotionalPost(id: string, postData: Partial<DevotionalPost>): Promise<DevotionalPost | undefined>;
  deleteDevotionalPost(id: string): Promise<boolean>;

  getDevotionalComments(postId: string): Promise<DevotionalComment[]>;
  createDevotionalComment(insertComment: InsertDevotionalComment): Promise<DevotionalComment>;
  updateDevotionalComment(id: string, commentData: Partial<DevotionalComment>): Promise<DevotionalComment | undefined>;
  deleteDevotionalComment(id: string): Promise<boolean>;

  // Event methods
  getEvents(userId: string, familyId?: string): Promise<Event[]>;
  createEvent(insertEvent: InsertEvent): Promise<Event>;
  updateEvent(id: string, eventData: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Event task methods
  getEventTasks(eventId: string): Promise<EventTask[]>;
  createEventTask(insertTask: InsertEventTask): Promise<EventTask>;
  updateEventTask(id: string, taskData: Partial<EventTask>): Promise<EventTask | undefined>;
  deleteEventTask(id: string): Promise<boolean>;

  // Event budget methods
  getEventBudget(eventId: string): Promise<EventBudget[]>;
  createEventBudget(insertBudget: InsertEventBudget): Promise<EventBudget>;
  updateEventBudget(id: string, budgetData: Partial<EventBudget>): Promise<EventBudget | undefined>;
  deleteEventBudget(id: string): Promise<boolean>;

  // Recipe methods
  getRecipes(userId: string, familyId?: string): Promise<Recipe[]>;
  createRecipe(insertRecipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipeData: Partial<Recipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;

  // Meal plan methods
  getMealPlans(userId: string, familyId?: string): Promise<MealPlan[]>;
  createMealPlan(insertMealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: string, mealPlanData: Partial<MealPlan>): Promise<MealPlan | undefined>;
  deleteMealPlan(id: string): Promise<boolean>;

  // Mealie settings methods
  getMealieSettings(userId: string): Promise<MealieSettings | undefined>;
  createMealieSettings(insertSettings: InsertMealieSettings): Promise<MealieSettings>;
  updateMealieSettings(id: string, settingsData: Partial<MealieSettings>): Promise<MealieSettings | undefined>;
  deleteMealieSettings(id: string): Promise<boolean>;

  // Emoji reaction methods
  getEmojiReactions(targetType: string, targetId: string): Promise<EmojiReaction[]>;
  createEmojiReaction(insertReaction: InsertEmojiReaction): Promise<EmojiReaction>;
  deleteEmojiReaction(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Family methods
  async getFamily(id: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family || undefined;
  }

  async getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.inviteCode, inviteCode));
    return family || undefined;
  }

  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const [family] = await db.insert(families).values(insertFamily).returning();
    return family;
  }

  async joinFamily(userId: string, familyId: string): Promise<boolean> {
    const [user] = await db.update(users).set({ familyId }).where(eq(users.id, userId)).returning();
    return !!user;
  }

  // Task methods
  async getTasks(userId: string, familyId?: string): Promise<Task[]> {
    return await db.select().from(tasks).where(
      or(
        eq(tasks.userId, userId),
        familyId ? eq(tasks.familyId, familyId) : sql`false`
      )
    ).orderBy(desc(tasks.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(taskData).where(eq(tasks.id, id)).returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // List methods
  async getLists(userId: string, familyId?: string): Promise<List[]> {
    return await db.select().from(lists).where(
      or(
        eq(lists.userId, userId),
        familyId ? eq(lists.familyId, familyId) : sql`false`
      )
    ).orderBy(desc(lists.createdAt));
  }

  async createList(insertList: InsertList): Promise<List> {
    const [list] = await db.insert(lists).values(insertList).returning();
    return list;
  }

  async updateList(id: string, listData: Partial<List>): Promise<List | undefined> {
    const [list] = await db.update(lists).set(listData).where(eq(lists.id, id)).returning();
    return list || undefined;
  }

  async deleteList(id: string): Promise<boolean> {
    const result = await db.delete(lists).where(eq(lists.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // List item methods
  async getListItems(listId: string): Promise<ListItem[]> {
    return await db.select().from(listItems).where(eq(listItems.listId, listId)).orderBy(desc(listItems.createdAt));
  }

  async createListItem(insertListItem: InsertListItem): Promise<ListItem> {
    const [item] = await db.insert(listItems).values(insertListItem).returning();
    return item;
  }

  async updateListItem(id: string, itemData: Partial<ListItem>): Promise<ListItem | undefined> {
    const [item] = await db.update(listItems).set(itemData).where(eq(listItems.id, id)).returning();
    return item || undefined;
  }

  async deleteListItem(id: string): Promise<boolean> {
    const result = await db.delete(listItems).where(eq(listItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Calendar event methods
  async getCalendarEvents(userId: string, familyId?: string): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents).where(
      or(
        eq(calendarEvents.userId, userId),
        familyId ? eq(calendarEvents.familyId, familyId) : sql`false`
      )
    ).orderBy(desc(calendarEvents.startTime));
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db.insert(calendarEvents).values(insertEvent).returning();
    return event;
  }

  async updateCalendarEvent(id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const [event] = await db.update(calendarEvents).set(eventData).where(eq(calendarEvents.id, id)).returning();
    return event || undefined;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Budget category methods
  async getBudgetCategories(userId: string, familyId?: string): Promise<BudgetCategory[]> {
    return await db.select().from(budgetCategories).where(
      or(
        eq(budgetCategories.userId, userId),
        familyId ? eq(budgetCategories.familyId, familyId) : sql`false`
      )
    ).orderBy(desc(budgetCategories.createdAt));
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const [category] = await db.insert(budgetCategories).values(insertCategory).returning();
    return category;
  }

  async updateBudgetCategory(id: string, categoryData: Partial<BudgetCategory>): Promise<BudgetCategory | undefined> {
    const [category] = await db.update(budgetCategories).set(categoryData).where(eq(budgetCategories.id, id)).returning();
    return category || undefined;
  }

  async deleteBudgetCategory(id: string): Promise<boolean> {
    const result = await db.delete(budgetCategories).where(eq(budgetCategories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Budget transaction methods
  async getBudgetTransactions(userId: string, familyId?: string): Promise<BudgetTransaction[]> {
    return await db.select().from(budgetTransactions).where(
      or(
        eq(budgetTransactions.userId, userId),
        familyId ? eq(budgetTransactions.familyId, familyId) : sql`false`
      )
    ).orderBy(desc(budgetTransactions.date));
  }

  async createBudgetTransaction(insertTransaction: InsertBudgetTransaction): Promise<BudgetTransaction> {
    const [transaction] = await db.insert(budgetTransactions).values(insertTransaction).returning();
    return transaction;
  }

  async updateBudgetTransaction(id: string, transactionData: Partial<BudgetTransaction>): Promise<BudgetTransaction | undefined> {
    const [transaction] = await db.update(budgetTransactions).set(transactionData).where(eq(budgetTransactions.id, id)).returning();
    return transaction || undefined;
  }

  async deleteBudgetTransaction(id: string): Promise<boolean> {
    const result = await db.delete(budgetTransactions).where(eq(budgetTransactions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Chat methods
  async getChatMessages(familyId: string, limit = 50): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.familyId, familyId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  // Devotional methods
  async getDevotionalPosts(userId: string, familyId?: string): Promise<DevotionalPost[]> {
    return await db.select().from(devotionalPosts).where(
      or(
        eq(devotionalPosts.userId, userId),
        familyId ? eq(devotionalPosts.familyId, familyId) : sql`false`
      )
    ).orderBy(desc(devotionalPosts.date));
  }

  async createDevotionalPost(insertPost: InsertDevotionalPost): Promise<DevotionalPost> {
    const [post] = await db.insert(devotionalPosts).values(insertPost).returning();
    return post;
  }

  async updateDevotionalPost(id: string, postData: Partial<DevotionalPost>): Promise<DevotionalPost | undefined> {
    const [post] = await db.update(devotionalPosts).set(postData).where(eq(devotionalPosts.id, id)).returning();
    return post || undefined;
  }

  async deleteDevotionalPost(id: string): Promise<boolean> {
    const result = await db.delete(devotionalPosts).where(eq(devotionalPosts.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDevotionalComments(postId: string): Promise<DevotionalComment[]> {
    return await db.select().from(devotionalComments)
      .where(eq(devotionalComments.postId, postId))
      .orderBy(desc(devotionalComments.createdAt));
  }

  async createDevotionalComment(insertComment: InsertDevotionalComment): Promise<DevotionalComment> {
    const [comment] = await db.insert(devotionalComments).values(insertComment).returning();
    return comment;
  }

  async updateDevotionalComment(id: string, commentData: Partial<DevotionalComment>): Promise<DevotionalComment | undefined> {
    const [comment] = await db.update(devotionalComments).set(commentData).where(eq(devotionalComments.id, id)).returning();
    return comment || undefined;
  }

  async deleteDevotionalComment(id: string): Promise<boolean> {
    const result = await db.delete(devotionalComments).where(eq(devotionalComments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Event methods
  async getEvents(userId: string, familyId?: string): Promise<Event[]> {
    return await db.select().from(events).where(
      or(
        eq(events.userId, userId),
        familyId ? eq(events.familyId, familyId) : sql`false`
      )
    ).orderBy(desc(events.date));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db.update(events).set(eventData).where(eq(events.id, id)).returning();
    return event || undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Event task methods
  async getEventTasks(eventId: string): Promise<EventTask[]> {
    return await db.select().from(eventTasks).where(eq(eventTasks.eventId, eventId)).orderBy(desc(eventTasks.createdAt));
  }

  async createEventTask(insertTask: InsertEventTask): Promise<EventTask> {
    const [task] = await db.insert(eventTasks).values(insertTask).returning();
    return task;
  }

  async updateEventTask(id: string, taskData: Partial<EventTask>): Promise<EventTask | undefined> {
    const [task] = await db.update(eventTasks).set(taskData).where(eq(eventTasks.id, id)).returning();
    return task || undefined;
  }

  async deleteEventTask(id: string): Promise<boolean> {
    const result = await db.delete(eventTasks).where(eq(eventTasks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Event budget methods
  async getEventBudget(eventId: string): Promise<EventBudget[]> {
    return await db.select().from(eventBudget).where(eq(eventBudget.eventId, eventId)).orderBy(desc(eventBudget.createdAt));
  }

  async createEventBudget(insertBudget: InsertEventBudget): Promise<EventBudget> {
    const [budget] = await db.insert(eventBudget).values(insertBudget).returning();
    return budget;
  }

  async updateEventBudget(id: string, budgetData: Partial<EventBudget>): Promise<EventBudget | undefined> {
    const [budget] = await db.update(eventBudget).set(budgetData).where(eq(eventBudget.id, id)).returning();
    return budget || undefined;
  }

  async deleteEventBudget(id: string): Promise<boolean> {
    const result = await db.delete(eventBudget).where(eq(eventBudget.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Recipe methods
  async getRecipes(userId: string, familyId?: string): Promise<Recipe[]> {
    return await db.select().from(recipes).where(
      or(
        eq(recipes.userId, userId),
        familyId ? eq(recipes.familyId, familyId) : sql`false`
      )
    ).orderBy(desc(recipes.createdAt));
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values(insertRecipe).returning();
    return recipe;
  }

  async updateRecipe(id: string, recipeData: Partial<Recipe>): Promise<Recipe | undefined> {
    const [recipe] = await db.update(recipes).set(recipeData).where(eq(recipes.id, id)).returning();
    return recipe || undefined;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Meal plan methods
  async getMealPlans(userId: string, familyId?: string): Promise<MealPlan[]> {
    return await db.select().from(mealPlans).where(
      or(
        eq(mealPlans.userId, userId),
        familyId ? eq(mealPlans.familyId, familyId) : sql`false`
      )
    ).orderBy(desc(mealPlans.createdAt));
  }

  async createMealPlan(insertMealPlan: InsertMealPlan): Promise<MealPlan> {
    const [mealPlan] = await db.insert(mealPlans).values(insertMealPlan).returning();
    return mealPlan;
  }

  async updateMealPlan(id: string, mealPlanData: Partial<MealPlan>): Promise<MealPlan | undefined> {
    const [mealPlan] = await db.update(mealPlans).set(mealPlanData).where(eq(mealPlans.id, id)).returning();
    return mealPlan || undefined;
  }

  async deleteMealPlan(id: string): Promise<boolean> {
    const result = await db.delete(mealPlans).where(eq(mealPlans.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Mealie settings methods
  async getMealieSettings(userId: string): Promise<MealieSettings | undefined> {
    const [settings] = await db.select().from(mealieSettings).where(eq(mealieSettings.userId, userId));
    return settings || undefined;
  }

  async createMealieSettings(insertSettings: InsertMealieSettings): Promise<MealieSettings> {
    const [settings] = await db.insert(mealieSettings).values(insertSettings).returning();
    return settings;
  }

  async updateMealieSettings(id: string, settingsData: Partial<MealieSettings>): Promise<MealieSettings | undefined> {
    const [settings] = await db.update(mealieSettings).set(settingsData).where(eq(mealieSettings.id, id)).returning();
    return settings || undefined;
  }

  async deleteMealieSettings(id: string): Promise<boolean> {
    const result = await db.delete(mealieSettings).where(eq(mealieSettings.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Emoji reaction methods
  async getEmojiReactions(targetType: string, targetId: string): Promise<EmojiReaction[]> {
    return await db.select().from(emojiReactions).where(
      and(
        eq(emojiReactions.targetType, targetType),
        eq(emojiReactions.targetId, targetId)
      )
    ).orderBy(desc(emojiReactions.createdAt));
  }

  async createEmojiReaction(insertReaction: InsertEmojiReaction): Promise<EmojiReaction> {
    const [reaction] = await db.insert(emojiReactions).values(insertReaction).returning();
    return reaction;
  }

  async deleteEmojiReaction(id: string): Promise<boolean> {
    const result = await db.delete(emojiReactions).where(eq(emojiReactions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();