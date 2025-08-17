import { randomUUID } from "crypto";
import { 
  User, InsertUser, Family, InsertFamily, Task, InsertTask, List, InsertList, 
  ListItem, InsertListItem, CalendarEvent, InsertCalendarEvent, BudgetCategory, 
  InsertBudgetCategory, BudgetTransaction, InsertBudgetTransaction, ChatMessage, 
  InsertChatMessage, DevotionalPost, InsertDevotionalPost, DevotionalComment, 
  InsertDevotionalComment, Event, InsertEvent, EventTask, InsertEventTask, 
  EventBudget, InsertEventBudget, MealieSettings, InsertMealieSettings, Recipe, 
  InsertRecipe, MealPlan, InsertMealPlan, EmojiReaction, InsertEmojiReaction,
  users, families, tasks, lists, listItems, calendarEvents, budgetCategories, 
  budgetTransactions, chatMessages, devotionalPosts, devotionalComments, events, 
  eventTasks, eventBudgets, recipes, mealPlans, mealieSettings, emojiReactions
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

function generateInviteCode(): string {
  const adjectives = ["BLUE", "RED", "GREEN", "GOLDEN", "SILVER", "PURPLE", "ORANGE", "PINK"];
  const nouns = ["OCEAN", "MOUNTAIN", "FOREST", "RIVER", "VALLEY", "CLOUD", "STAR", "MOON"];
  const number = Math.floor(Math.random() * 100);
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}-${noun}-${number.toString().padStart(2, '0')}`;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  // Family methods
  getFamily(id: string): Promise<Family | undefined>;
  getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  getFamilyMembers(familyId: string): Promise<User[]>;
  
  // Task methods
  getTasks(userId: string, familyId?: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  // List methods
  getLists(userId: string, familyId?: string): Promise<List[]>;
  getList(id: string): Promise<List | undefined>;
  createList(list: InsertList): Promise<List>;
  updateList(id: string, list: Partial<List>): Promise<List | undefined>;
  deleteList(id: string): Promise<boolean>;
  
  // List item methods
  getListItems(listId: string): Promise<ListItem[]>;
  createListItem(item: InsertListItem): Promise<ListItem>;
  updateListItem(id: string, item: Partial<ListItem>): Promise<ListItem | undefined>;
  deleteListItem(id: string): Promise<boolean>;
  
  // Calendar event methods
  getCalendarEvents(userId: string, familyId?: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;
  
  // Budget methods
  getBudgetCategories(userId: string, familyId?: string): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: string, category: Partial<BudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: string): Promise<boolean>;
  
  getBudgetTransactions(userId: string, familyId?: string): Promise<BudgetTransaction[]>;
  createBudgetTransaction(transaction: InsertBudgetTransaction): Promise<BudgetTransaction>;
  updateBudgetTransaction(id: string, transaction: Partial<BudgetTransaction>): Promise<BudgetTransaction | undefined>;
  deleteBudgetTransaction(id: string): Promise<boolean>;
  
  // Chat methods
  getChatMessages(familyId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Devotional methods
  getDevotionalPosts(userId: string, familyId?: string): Promise<DevotionalPost[]>;
  createDevotionalPost(post: InsertDevotionalPost): Promise<DevotionalPost>;
  updateDevotionalPost(id: string, post: Partial<DevotionalPost>): Promise<DevotionalPost | undefined>;
  deleteDevotionalPost(id: string): Promise<boolean>;
  
  getDevotionalComments(postId: string): Promise<DevotionalComment[]>;
  createDevotionalComment(comment: InsertDevotionalComment): Promise<DevotionalComment>;
  updateDevotionalComment(id: string, comment: Partial<DevotionalComment>): Promise<DevotionalComment | undefined>;
  deleteDevotionalComment(id: string): Promise<boolean>;
  
  // Event methods
  getEvents(userId: string, familyId?: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // Event task methods
  getEventTasks(eventId: string): Promise<EventTask[]>;
  createEventTask(task: InsertEventTask): Promise<EventTask>;
  updateEventTask(id: string, task: Partial<EventTask>): Promise<EventTask | undefined>;
  deleteEventTask(id: string): Promise<boolean>;
  
  // Event budget methods
  getEventBudget(eventId: string): Promise<EventBudget[]>;
  createEventBudget(budget: InsertEventBudget): Promise<EventBudget>;
  updateEventBudget(id: string, budget: Partial<EventBudget>): Promise<EventBudget | undefined>;
  deleteEventBudget(id: string): Promise<boolean>;
  
  // Recipe methods
  getRecipes(userId: string, familyId?: string): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;
  
  // Meal plan methods
  getMealPlans(userId: string, familyId?: string): Promise<MealPlan[]>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: string, mealPlan: Partial<MealPlan>): Promise<MealPlan | undefined>;
  deleteMealPlan(id: string): Promise<boolean>;
  
  // Mealie settings methods
  getMealieSettings(userId: string): Promise<MealieSettings | undefined>;
  createMealieSettings(settings: InsertMealieSettings): Promise<MealieSettings>;
  updateMealieSettings(id: string, settings: Partial<MealieSettings>): Promise<MealieSettings | undefined>;
  deleteMealieSettings(id: string): Promise<boolean>;
  
  // Emoji reaction methods
  getEmojiReactions(targetType: string, targetId: string): Promise<EmojiReaction[]>;
  createEmojiReaction(reaction: InsertEmojiReaction): Promise<EmojiReaction>;
  deleteEmojiReaction(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private families = new Map<string, Family>();
  private tasks = new Map<string, Task>();
  private lists = new Map<string, List>();
  private listItems = new Map<string, ListItem>();
  private calendarEvents = new Map<string, CalendarEvent>();
  private budgetCategories = new Map<string, BudgetCategory>();
  private budgetTransactions = new Map<string, BudgetTransaction>();
  private chatMessages = new Map<string, ChatMessage>();
  private devotionalPosts = new Map<string, DevotionalPost>();
  private devotionalComments = new Map<string, DevotionalComment>();
  private events = new Map<string, Event>();
  private eventTasks = new Map<string, EventTask>();
  private eventBudgets = new Map<string, EventBudget>();
  private recipes = new Map<string, Recipe>();
  private mealPlans = new Map<string, MealPlan>();
  private mealieSettings = new Map<string, MealieSettings>();
  private emojiReactions = new Map<string, EmojiReaction>();

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Family methods
  async getFamily(id: string): Promise<Family | undefined> {
    return this.families.get(id);
  }

  async getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined> {
    return Array.from(this.families.values()).find(family => family.inviteCode === inviteCode);
  }

  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const id = randomUUID();
    const family: Family = { 
      ...insertFamily, 
      id, 
      inviteCode: insertFamily.inviteCode || generateInviteCode(),
      createdAt: new Date() 
    };
    this.families.set(id, family);
    return family;
  }

  async getFamilyMembers(familyId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.familyId === familyId);
  }

  // Task methods
  async getTasks(userId: string, familyId?: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.userId === userId || (familyId && task.familyId === familyId)
    );
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = { ...insertTask, id, createdAt: new Date() };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // List methods
  async getLists(userId: string, familyId?: string): Promise<List[]> {
    return Array.from(this.lists.values()).filter(list => 
      list.userId === userId || (familyId && list.familyId === familyId)
    );
  }

  async getList(id: string): Promise<List | undefined> {
    return this.lists.get(id);
  }

  async createList(insertList: InsertList): Promise<List> {
    const id = randomUUID();
    const list: List = { ...insertList, id, createdAt: new Date() };
    this.lists.set(id, list);
    return list;
  }

  async updateList(id: string, listData: Partial<List>): Promise<List | undefined> {
    const list = this.lists.get(id);
    if (!list) return undefined;
    
    const updatedList = { ...list, ...listData };
    this.lists.set(id, updatedList);
    return updatedList;
  }

  async deleteList(id: string): Promise<boolean> {
    return this.lists.delete(id);
  }

  // List item methods
  async getListItems(listId: string): Promise<ListItem[]> {
    return Array.from(this.listItems.values()).filter(item => item.listId === listId);
  }

  async createListItem(insertListItem: InsertListItem): Promise<ListItem> {
    const id = randomUUID();
    const item: ListItem = { ...insertListItem, id, createdAt: new Date() };
    this.listItems.set(id, item);
    return item;
  }

  async updateListItem(id: string, itemData: Partial<ListItem>): Promise<ListItem | undefined> {
    const item = this.listItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.listItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteListItem(id: string): Promise<boolean> {
    return this.listItems.delete(id);
  }

  // Calendar event methods
  async getCalendarEvents(userId: string, familyId?: string): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values()).filter(event => 
      event.userId === userId || (familyId && event.familyId === familyId)
    );
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = randomUUID();
    const event: CalendarEvent = { ...insertEvent, id, createdAt: new Date() };
    this.calendarEvents.set(id, event);
    return event;
  }

  async updateCalendarEvent(id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const event = this.calendarEvents.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }

  // Budget methods
  async getBudgetCategories(userId: string, familyId?: string): Promise<BudgetCategory[]> {
    return Array.from(this.budgetCategories.values()).filter(category => 
      category.userId === userId || (familyId && category.familyId === familyId)
    );
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const id = randomUUID();
    const category: BudgetCategory = { 
      ...insertCategory, 
      id, 
      createdAt: new Date() 
    };
    this.budgetCategories.set(id, category);
    return category;
  }

  async updateBudgetCategory(id: string, categoryData: Partial<BudgetCategory>): Promise<BudgetCategory | undefined> {
    const category = this.budgetCategories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.budgetCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteBudgetCategory(id: string): Promise<boolean> {
    return this.budgetCategories.delete(id);
  }

  async getBudgetTransactions(userId: string, familyId?: string): Promise<BudgetTransaction[]> {
    return Array.from(this.budgetTransactions.values()).filter(transaction => 
      transaction.userId === userId || (familyId && transaction.familyId === familyId)
    );
  }

  async createBudgetTransaction(insertTransaction: InsertBudgetTransaction): Promise<BudgetTransaction> {
    const id = randomUUID();
    const transaction: BudgetTransaction = { 
      ...insertTransaction, 
      id, 
      createdAt: new Date() 
    };
    this.budgetTransactions.set(id, transaction);
    return transaction;
  }

  async updateBudgetTransaction(id: string, transactionData: Partial<BudgetTransaction>): Promise<BudgetTransaction | undefined> {
    const transaction = this.budgetTransactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...transactionData };
    this.budgetTransactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteBudgetTransaction(id: string): Promise<boolean> {
    return this.budgetTransactions.delete(id);
  }

  // Chat methods
  async getChatMessages(familyId: string, limit = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.familyId === familyId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0))
      .slice(-limit);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      createdAt: new Date() 
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Devotional methods
  async getDevotionalPosts(userId: string, familyId?: string): Promise<DevotionalPost[]> {
    return Array.from(this.devotionalPosts.values()).filter(post => 
      post.userId === userId || (familyId && post.familyId === familyId)
    );
  }

  async createDevotionalPost(insertPost: InsertDevotionalPost): Promise<DevotionalPost> {
    const id = randomUUID();
    const post: DevotionalPost = { 
      ...insertPost, 
      id, 
      createdAt: new Date() 
    };
    this.devotionalPosts.set(id, post);
    return post;
  }

  async updateDevotionalPost(id: string, postData: Partial<DevotionalPost>): Promise<DevotionalPost | undefined> {
    const post = this.devotionalPosts.get(id);
    if (!post) return undefined;
    
    const updatedPost = { ...post, ...postData };
    this.devotionalPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteDevotionalPost(id: string): Promise<boolean> {
    return this.devotionalPosts.delete(id);
  }

  async getDevotionalComments(postId: string): Promise<DevotionalComment[]> {
    return Array.from(this.devotionalComments.values()).filter(comment => comment.postId === postId);
  }

  async createDevotionalComment(insertComment: InsertDevotionalComment): Promise<DevotionalComment> {
    const id = randomUUID();
    const comment: DevotionalComment = { 
      ...insertComment, 
      id, 
      createdAt: new Date() 
    };
    this.devotionalComments.set(id, comment);
    return comment;
  }

  async updateDevotionalComment(id: string, commentData: Partial<DevotionalComment>): Promise<DevotionalComment | undefined> {
    const comment = this.devotionalComments.get(id);
    if (!comment) return undefined;
    
    const updatedComment = { ...comment, ...commentData };
    this.devotionalComments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteDevotionalComment(id: string): Promise<boolean> {
    return this.devotionalComments.delete(id);
  }

  // Event methods
  async getEvents(userId: string, familyId?: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => 
      event.userId === userId || (familyId && event.familyId === familyId)
    );
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = { 
      ...insertEvent, 
      id, 
      createdAt: new Date() 
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Event task methods
  async getEventTasks(eventId: string): Promise<EventTask[]> {
    return Array.from(this.eventTasks.values()).filter(task => task.eventId === eventId);
  }

  async createEventTask(insertTask: InsertEventTask): Promise<EventTask> {
    const id = randomUUID();
    const task: EventTask = { 
      ...insertTask, 
      id, 
      createdAt: new Date() 
    };
    this.eventTasks.set(id, task);
    return task;
  }

  async updateEventTask(id: string, taskData: Partial<EventTask>): Promise<EventTask | undefined> {
    const task = this.eventTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskData };
    this.eventTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteEventTask(id: string): Promise<boolean> {
    return this.eventTasks.delete(id);
  }

  // Event budget methods
  async getEventBudget(eventId: string): Promise<EventBudget[]> {
    return Array.from(this.eventBudgets.values()).filter(budget => budget.eventId === eventId);
  }

  async createEventBudget(insertBudget: InsertEventBudget): Promise<EventBudget> {
    const id = randomUUID();
    const budget: EventBudget = { 
      ...insertBudget, 
      id, 
      createdAt: new Date() 
    };
    this.eventBudgets.set(id, budget);
    return budget;
  }

  async updateEventBudget(id: string, budgetData: Partial<EventBudget>): Promise<EventBudget | undefined> {
    const budget = this.eventBudgets.get(id);
    if (!budget) return undefined;
    
    const updatedBudget = { ...budget, ...budgetData };
    this.eventBudgets.set(id, updatedBudget);
    return updatedBudget;
  }

  async deleteEventBudget(id: string): Promise<boolean> {
    return this.eventBudgets.delete(id);
  }

  // Recipe methods
  async getRecipes(userId: string, familyId?: string): Promise<Recipe[]> {
    return Array.from(this.recipes.values()).filter(recipe => 
      recipe.userId === userId || (familyId && recipe.familyId === familyId)
    );
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const id = randomUUID();
    const recipe: Recipe = { 
      ...insertRecipe, 
      id, 
      createdAt: new Date() 
    };
    this.recipes.set(id, recipe);
    return recipe;
  }

  async updateRecipe(id: string, recipeData: Partial<Recipe>): Promise<Recipe | undefined> {
    const recipe = this.recipes.get(id);
    if (!recipe) return undefined;
    
    const updatedRecipe = { ...recipe, ...recipeData };
    this.recipes.set(id, updatedRecipe);
    return updatedRecipe;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    return this.recipes.delete(id);
  }

  // Meal plan methods
  async getMealPlans(userId: string, familyId?: string): Promise<MealPlan[]> {
    return Array.from(this.mealPlans.values()).filter(plan => 
      plan.userId === userId || (familyId && plan.familyId === familyId)
    );
  }

  async createMealPlan(insertMealPlan: InsertMealPlan): Promise<MealPlan> {
    const id = randomUUID();
    const mealPlan: MealPlan = { 
      ...insertMealPlan, 
      id, 
      createdAt: new Date() 
    };
    this.mealPlans.set(id, mealPlan);
    return mealPlan;
  }

  async updateMealPlan(id: string, mealPlanData: Partial<MealPlan>): Promise<MealPlan | undefined> {
    const mealPlan = this.mealPlans.get(id);
    if (!mealPlan) return undefined;
    
    const updatedMealPlan = { ...mealPlan, ...mealPlanData };
    this.mealPlans.set(id, updatedMealPlan);
    return updatedMealPlan;
  }

  async deleteMealPlan(id: string): Promise<boolean> {
    return this.mealPlans.delete(id);
  }

  // Mealie settings methods
  async getMealieSettings(userId: string): Promise<MealieSettings | undefined> {
    return Array.from(this.mealieSettings.values()).find(settings => settings.userId === userId);
  }

  async createMealieSettings(insertSettings: InsertMealieSettings): Promise<MealieSettings> {
    const id = randomUUID();
    const settings: MealieSettings = { 
      ...insertSettings, 
      id, 
      createdAt: new Date() 
    };
    this.mealieSettings.set(id, settings);
    return settings;
  }

  async updateMealieSettings(id: string, settingsData: Partial<MealieSettings>): Promise<MealieSettings | undefined> {
    const settings = this.mealieSettings.get(id);
    if (!settings) return undefined;
    
    const updatedSettings = { ...settings, ...settingsData };
    this.mealieSettings.set(id, updatedSettings);
    return updatedSettings;
  }

  async deleteMealieSettings(id: string): Promise<boolean> {
    return this.mealieSettings.delete(id);
  }

  // Emoji reaction methods
  async getEmojiReactions(targetType: string, targetId: string): Promise<EmojiReaction[]> {
    return Array.from(this.emojiReactions.values()).filter(reaction => 
      reaction.targetType === targetType && reaction.targetId === targetId
    );
  }

  async createEmojiReaction(insertReaction: InsertEmojiReaction): Promise<EmojiReaction> {
    const id = randomUUID();
    const reaction: EmojiReaction = { 
      ...insertReaction, 
      id, 
      createdAt: new Date() 
    };
    this.emojiReactions.set(id, reaction);
    return reaction;
  }

  async deleteEmojiReaction(id: string): Promise<boolean> {
    return this.emojiReactions.delete(id);
  }
}

// DatabaseStorage implementation

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
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        passwordHash: hashedPassword
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
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
    const [family] = await db
      .insert(families)
      .values(insertFamily)
      .returning();
    return family;
  }

  async getFamilyMembers(familyId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.familyId, familyId));
  }

  // For now, delegate other methods to MemStorage to avoid breaking the app
  private memStorage = new MemStorage();

  async getTasks(userId: string, familyId?: string): Promise<Task[]> {
    return this.memStorage.getTasks(userId, familyId);
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.memStorage.getTask(id);
  }

  async createTask(task: InsertTask): Promise<Task> {
    return this.memStorage.createTask(task);
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task | undefined> {
    return this.memStorage.updateTask(id, task);
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.memStorage.deleteTask(id);
  }

  async getLists(userId: string, familyId?: string): Promise<List[]> {
    return this.memStorage.getLists(userId, familyId);
  }

  async getList(id: string): Promise<List | undefined> {
    return this.memStorage.getList(id);
  }

  async createList(list: InsertList): Promise<List> {
    return this.memStorage.createList(list);
  }

  async updateList(id: string, list: Partial<List>): Promise<List | undefined> {
    return this.memStorage.updateList(id, list);
  }

  async deleteList(id: string): Promise<boolean> {
    return this.memStorage.deleteList(id);
  }

  async getListItems(listId: string): Promise<ListItem[]> {
    return this.memStorage.getListItems(listId);
  }

  async createListItem(item: InsertListItem): Promise<ListItem> {
    return this.memStorage.createListItem(item);
  }

  async updateListItem(id: string, item: Partial<ListItem>): Promise<ListItem | undefined> {
    return this.memStorage.updateListItem(id, item);
  }

  async deleteListItem(id: string): Promise<boolean> {
    return this.memStorage.deleteListItem(id);
  }

  async getCalendarEvents(userId: string, familyId?: string): Promise<CalendarEvent[]> {
    return this.memStorage.getCalendarEvents(userId, familyId);
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    return this.memStorage.createCalendarEvent(event);
  }

  async updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    return this.memStorage.updateCalendarEvent(id, event);
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return this.memStorage.deleteCalendarEvent(id);
  }

  async getBudgetCategories(userId: string, familyId?: string): Promise<BudgetCategory[]> {
    return this.memStorage.getBudgetCategories(userId, familyId);
  }

  async createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory> {
    return this.memStorage.createBudgetCategory(category);
  }

  async updateBudgetCategory(id: string, category: Partial<BudgetCategory>): Promise<BudgetCategory | undefined> {
    return this.memStorage.updateBudgetCategory(id, category);
  }

  async deleteBudgetCategory(id: string): Promise<boolean> {
    return this.memStorage.deleteBudgetCategory(id);
  }

  async getBudgetTransactions(userId: string, familyId?: string): Promise<BudgetTransaction[]> {
    return this.memStorage.getBudgetTransactions(userId, familyId);
  }

  async createBudgetTransaction(transaction: InsertBudgetTransaction): Promise<BudgetTransaction> {
    return this.memStorage.createBudgetTransaction(transaction);
  }

  async updateBudgetTransaction(id: string, transaction: Partial<BudgetTransaction>): Promise<BudgetTransaction | undefined> {
    return this.memStorage.updateBudgetTransaction(id, transaction);
  }

  async deleteBudgetTransaction(id: string): Promise<boolean> {
    return this.memStorage.deleteBudgetTransaction(id);
  }

  async getChatMessages(familyId: string, limit?: number): Promise<ChatMessage[]> {
    return this.memStorage.getChatMessages(familyId, limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    return this.memStorage.createChatMessage(message);
  }

  async getDevotionalPosts(userId: string, familyId?: string): Promise<DevotionalPost[]> {
    return this.memStorage.getDevotionalPosts(userId, familyId);
  }

  async createDevotionalPost(post: InsertDevotionalPost): Promise<DevotionalPost> {
    return this.memStorage.createDevotionalPost(post);
  }

  async updateDevotionalPost(id: string, post: Partial<DevotionalPost>): Promise<DevotionalPost | undefined> {
    return this.memStorage.updateDevotionalPost(id, post);
  }

  async deleteDevotionalPost(id: string): Promise<boolean> {
    return this.memStorage.deleteDevotionalPost(id);
  }

  async getDevotionalComments(postId: string): Promise<DevotionalComment[]> {
    return this.memStorage.getDevotionalComments(postId);
  }

  async createDevotionalComment(comment: InsertDevotionalComment): Promise<DevotionalComment> {
    return this.memStorage.createDevotionalComment(comment);
  }

  async updateDevotionalComment(id: string, comment: Partial<DevotionalComment>): Promise<DevotionalComment | undefined> {
    return this.memStorage.updateDevotionalComment(id, comment);
  }

  async deleteDevotionalComment(id: string): Promise<boolean> {
    return this.memStorage.deleteDevotionalComment(id);
  }

  async getEvents(userId: string, familyId?: string): Promise<Event[]> {
    return this.memStorage.getEvents(userId, familyId);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    return this.memStorage.createEvent(event);
  }

  async updateEvent(id: string, event: Partial<Event>): Promise<Event | undefined> {
    return this.memStorage.updateEvent(id, event);
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.memStorage.deleteEvent(id);
  }

  async getEventTasks(eventId: string): Promise<EventTask[]> {
    return this.memStorage.getEventTasks(eventId);
  }

  async createEventTask(task: InsertEventTask): Promise<EventTask> {
    return this.memStorage.createEventTask(task);
  }

  async updateEventTask(id: string, task: Partial<EventTask>): Promise<EventTask | undefined> {
    return this.memStorage.updateEventTask(id, task);
  }

  async deleteEventTask(id: string): Promise<boolean> {
    return this.memStorage.deleteEventTask(id);
  }

  async getEventBudget(eventId: string): Promise<EventBudget[]> {
    return this.memStorage.getEventBudget(eventId);
  }

  async createEventBudget(budget: InsertEventBudget): Promise<EventBudget> {
    return this.memStorage.createEventBudget(budget);
  }

  async updateEventBudget(id: string, budget: Partial<EventBudget>): Promise<EventBudget | undefined> {
    return this.memStorage.updateEventBudget(id, budget);
  }

  async deleteEventBudget(id: string): Promise<boolean> {
    return this.memStorage.deleteEventBudget(id);
  }

  async getRecipes(userId: string, familyId?: string): Promise<Recipe[]> {
    return this.memStorage.getRecipes(userId, familyId);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    return this.memStorage.createRecipe(recipe);
  }

  async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe | undefined> {
    return this.memStorage.updateRecipe(id, recipe);
  }

  async deleteRecipe(id: string): Promise<boolean> {
    return this.memStorage.deleteRecipe(id);
  }

  async getMealPlans(userId: string, familyId?: string): Promise<MealPlan[]> {
    return this.memStorage.getMealPlans(userId, familyId);
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    return this.memStorage.createMealPlan(mealPlan);
  }

  async updateMealPlan(id: string, mealPlan: Partial<MealPlan>): Promise<MealPlan | undefined> {
    return this.memStorage.updateMealPlan(id, mealPlan);
  }

  async deleteMealPlan(id: string): Promise<boolean> {
    return this.memStorage.deleteMealPlan(id);
  }

  async getMealieSettings(userId: string): Promise<MealieSettings | undefined> {
    return this.memStorage.getMealieSettings(userId);
  }

  async createMealieSettings(settings: InsertMealieSettings): Promise<MealieSettings> {
    return this.memStorage.createMealieSettings(settings);
  }

  async updateMealieSettings(id: string, settings: Partial<MealieSettings>): Promise<MealieSettings | undefined> {
    return this.memStorage.updateMealieSettings(id, settings);
  }

  async deleteMealieSettings(id: string): Promise<boolean> {
    return this.memStorage.deleteMealieSettings(id);
  }

  async getEmojiReactions(targetType: string, targetId: string): Promise<EmojiReaction[]> {
    return this.memStorage.getEmojiReactions(targetType, targetId);
  }

  async createEmojiReaction(reaction: InsertEmojiReaction): Promise<EmojiReaction> {
    return this.memStorage.createEmojiReaction(reaction);
  }

  async deleteEmojiReaction(id: string): Promise<boolean> {
    return this.memStorage.deleteEmojiReaction(id);
  }
}

export const storage = new DatabaseStorage();