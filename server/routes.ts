import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, insertFamilySchema, insertTaskSchema, insertListSchema,
  insertListItemSchema, insertCalendarEventSchema, insertBudgetCategorySchema,
  insertBudgetTransactionSchema, insertChatMessageSchema, insertDevotionalPostSchema,
  insertDevotionalCommentSchema, insertEventSchema, insertEventTaskSchema,
  insertEventBudgetSchema, insertMealieSettingsSchema, insertRecipeSchema,
  insertMealPlanSchema, insertEmojiReactionSchema
} from "@shared/schema";
import { categorizeItem } from "./ai-categorizer";
import { generateTaskRecommendations, analyzeProductivityPatterns } from "./ai-task-recommender";
import { analyzeBehaviorPatterns, generateContextualInsights } from "./user-behavior-analyzer";
import { generateMealPlan, generateGroceryList } from "./ai-meal-planner";
import { analyzeBudgetWithCalendar, generateBudgetAlerts } from "./ai-budget-advisor";
import { generateCalendarInsights, generateEventPreparationTips } from "./ai-calendar-insights";
import { generateEventSuggestions, generateEventTypeTemplates, generateQuickEventSuggestions } from "./ai-event-assistant";
import { generateDailyDevotional, generateWeeklyDevotionalPlan, generateTopicalDevotional, generateDevotionalSuggestions } from "./ai-devotional-generator";
import { 
  ACHIEVEMENT_BADGES, 
  calculateLevelFromPoints,
  checkTaskCompletionAchievements,
  checkCollaborationAchievements,
  checkMilestoneAchievements,
  calculateBadgePoints
} from "./achievement-system";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    familyId?: string;
  };
}

// Middleware to verify JWT token
const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = {
      id: user.id,
      email: user.email,
      familyId: user.familyId || undefined
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const familyConnections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket, req) => {
    let userFamilyId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join' && message.familyId) {
          userFamilyId = message.familyId;
          if (!familyConnections.has(userFamilyId)) {
            familyConnections.set(userFamilyId, new Set());
          }
          familyConnections.get(userFamilyId)?.add(ws);
          
          // Send online count update
          const connections = familyConnections.get(userFamilyId);
          if (connections) {
            const onlineCount = Array.from(connections).filter(socket => socket.readyState === WebSocket.OPEN).length;
          
            connections.forEach(socket => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'online_count',
                count: onlineCount
              }));
            }
            });
          }
        }
        
        if (message.type === 'chat_message' && userFamilyId) {
          // Save message to storage
          const chatMessage = await storage.createChatMessage({
            message: message.content,
            userId: message.userId,
            familyId: userFamilyId
          });

          // Get user info for the message
          const user = await storage.getUser(message.userId);
          
          // Broadcast to all family members
          const connections = familyConnections.get(userFamilyId);
          if (connections) {
            const messageWithUser = {
              type: 'chat_message',
              message: {
                ...chatMessage,
                user: user ? { id: user.id, name: user.name } : null
              }
            };
            
            connections.forEach(socket => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(messageWithUser));
              }
            });
          }
        }
      } catch (error: any) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userFamilyId && familyConnections.has(userFamilyId)) {
        const connections = familyConnections.get(userFamilyId)!;
        connections.delete(ws);
        
        // Send updated online count
        const onlineCount = Array.from(connections).filter(socket => socket.readyState === WebSocket.OPEN).length;
        connections.forEach(socket => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'online_count',
              count: onlineCount
            }));
          }
        });
        
        if (connections.size === 0) {
          familyConnections.delete(userFamilyId);
        }
      }
    });
  });



  // PRODUCTION ADMIN: Clear production database
  app.post('/api/admin/clear-production-data', async (req: Request, res: Response) => {
    if (req.body.adminKey !== 'CLEAR_PRODUCTION_DATA_2025') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      // Use the storage interface to clear all data
      await storage.clearAllData();
      res.json({ message: 'Production database cleared successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Production clear error:', error);
      res.status(500).json({ error: 'Failed to clear production data', details: error.message });
    }
  });

  // Auth routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      console.log('Registration attempt with data:', req.body);
      const userData = insertUserSchema.parse(req.body);
      console.log('Parsed user data:', userData);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({ 
        user: { id: user.id, name: user.name, email: user.email, familyId: user.familyId },
        token 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: 'Invalid input', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({ 
        user: { id: user.id, name: user.name, email: user.email, familyId: user.familyId },
        token 
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        user: { id: user.id, name: user.name, email: user.email, familyId: user.familyId }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Family routes
  app.post('/api/families', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Family name is required' });
      }
      
      // Generate a unique invite code
      const generateInviteCode = () => {
        const adjectives = ['BLUE', 'RED', 'GREEN', 'GOLD', 'SILVER', 'PURPLE', 'ORANGE', 'PINK'];
        const nouns = ['OCEAN', 'MOUNTAIN', 'FOREST', 'RIVER', 'GARDEN', 'SUNSET', 'MEADOW', 'CASTLE'];
        const randomNum = Math.floor(Math.random() * 100);
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adjective}-${noun}-${randomNum}`;
      };
      
      const familyData = {
        name: name.trim(),
        inviteCode: generateInviteCode()
      };
      
      const family = await storage.createFamily(familyData);
      
      // Update user's familyId
      await storage.updateUser(req.user!.id, { familyId: family.id });
      
      res.json(family);
    } catch (error) {
      console.error('Family creation error:', error);
      res.status(500).json({ error: 'Failed to create family' });
    }
  });

  app.post('/api/families/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { inviteCode } = req.body;
      const family = await storage.getFamilyByInviteCode(inviteCode);
      
      if (!family) {
        return res.status(404).json({ error: 'Invalid invite code' });
      }

      // Check if user is already in this family
      if (req.user!.familyId === family.id) {
        return res.json({ 
          ...family, 
          message: 'You are already a member of this family' 
        });
      }
      
      // Update user's familyId
      await storage.updateUser(req.user!.id, { familyId: family.id });
      
      res.json({
        ...family,
        message: 'Successfully joined the family!'
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/families/:id/members', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const members = await storage.getFamilyMembers(id);
      res.json(members.map(member => ({ id: member.id, name: member.name, email: member.email })));
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Task routes
  app.get('/api/tasks', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tasks = await storage.getTasks(req.user!.id, req.user!.familyId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/tasks', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        userId: req.user!.id,
        familyId: req.user!.familyId
      });
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error('Task creation error:', error);
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.patch('/api/tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const task = await storage.updateTask(id, req.body);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // AI Task Recommendation routes
  app.get('/api/ai/task-recommendations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get user's recent tasks
      const recentTasks = await storage.getTasks(req.user!.id, req.user!.familyId);
      
      // Get family tasks for collaboration analysis
      let familyTasks: any[] = [];
      if (req.user!.familyId) {
        try {
          const familyMembers = await storage.getFamilyMembers(req.user!.familyId);
          for (const member of familyMembers) {
            if (member.id !== req.user!.id) {
              const memberTasks = await storage.getTasks(member.id, req.user!.familyId);
              familyTasks.push(...memberTasks.map(task => ({
                title: task.title,
                category: task.category,
                priority: task.priority,
                completed: task.completed,
                assignedTo: member.name,
                createdAt: new Date(task.createdAt)
              })));
            }
          }
        } catch (error) {
          console.log('Could not fetch family tasks:', error);
        }
      }
      
      // Get upcoming events (next 7 days)
      const upcomingEvents = await storage.getEvents(req.user!.id, req.user!.familyId);
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      
      const filteredEvents = upcomingEvents.filter(event => 
        new Date(event.date) <= oneWeekFromNow && new Date(event.date) >= new Date()
      );

      // Generate behavior analysis
      const behaviorProfile = await analyzeBehaviorPatterns(req.user!.id, recentTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        completed: task.completed,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        createdAt: new Date(task.createdAt),
        assignedTo: task.assignedTo
      })));

      // Determine time context
      const now = new Date();
      const hour = now.getHours();
      let timeOfDay: 'morning' | 'afternoon' | 'evening';
      if (hour < 12) timeOfDay = 'morning';
      else if (hour < 17) timeOfDay = 'afternoon';
      else timeOfDay = 'evening';

      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

      // Calculate recent completion streak
      const recentCompletions = recentTasks
        .filter(t => t.completed && t.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .slice(0, 7);

      const completionStreak = recentCompletions.length;
      const avgTasksPerDay = recentTasks.length > 0 ? Math.round(recentTasks.length / 30) : 3;

      const recommendations = await generateTaskRecommendations({
        userId: req.user!.id,
        familyId: req.user!.familyId,
        recentTasks: recentTasks.map(task => ({
          title: task.title,
          description: task.description || undefined,
          category: task.category || undefined,
          priority: task.priority || undefined,
          completed: task.completed,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          createdAt: new Date(task.createdAt),
          assignedTo: task.assignedTo
        })),
        familyTasks,
        upcomingEvents: filteredEvents.map(event => ({
          title: event.title,
          date: new Date(event.date),
          description: event.description || undefined
        })),
        timeOfDay,
        dayOfWeek,
        userPreferences: {
          workingHours: "9 AM - 5 PM",
          categories: behaviorProfile.taskPreferences.favoriteCategories,
          productivityStyle: behaviorProfile.taskPreferences.completionStyle,
          energyLevels: behaviorProfile.productivityPatterns.energyLevels,
          focusDuration: behaviorProfile.productivityPatterns.preferredTaskDuration
        },
        personalContext: {
          recentCompletionStreak: completionStreak,
          averageTasksPerDay: avgTasksPerDay,
          preferredTaskTypes: behaviorProfile.taskPreferences.favoriteCategories,
          avoidancePatterns: behaviorProfile.taskPreferences.avoidedCategories,
          motivationalFactors: Object.entries(behaviorProfile.motivationalFactors)
            .filter(([_, value]) => value)
            .map(([key, _]) => key)
        }
      });

      res.json({ 
        recommendations,
        behaviorProfile: {
          productivityPatterns: behaviorProfile.productivityPatterns,
          motivationalFactors: behaviorProfile.motivationalFactors,
          currentStreak: completionStreak,
          insights: behaviorProfile.behaviorInsights
        }
      });
    } catch (error) {
      console.error('Task recommendation error:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  });

  app.get('/api/ai/productivity-insights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tasks = await storage.getTasks(req.user!.id, req.user!.familyId);
      
      // Enhanced productivity analysis
      const behaviorProfile = await analyzeBehaviorPatterns(req.user!.id, tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        completed: task.completed,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        createdAt: new Date(task.createdAt),
        assignedTo: task.assignedTo
      })));

      // Generate contextual insights for current time
      const now = new Date();
      const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
      
      const recentCompletions = tasks.filter(t => t.completed && t.completedAt).length;
      const pendingTaskCount = tasks.filter(t => !t.completed).length;

      const contextualInsights = await generateContextualInsights(behaviorProfile, {
        timeOfDay,
        dayOfWeek,
        recentCompletions,
        pendingTaskCount
      });

      // Legacy format for existing components
      const legacyInsights = await analyzeProductivityPatterns(tasks.map(task => ({
        title: task.title,
        category: task.category || undefined,
        priority: task.priority || undefined,
        completed: task.completed,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        createdAt: new Date(task.createdAt)
      })));

      res.json({
        ...legacyInsights,
        enhanced: {
          behaviorProfile,
          contextualInsights,
          personalizedTips: contextualInsights.productivityTips,
          motivationalMessage: contextualInsights.motivationalMessage,
          currentEnergyLevel: contextualInsights.currentEnergyLevel,
          currentFocusLevel: contextualInsights.currentFocusLevel
        }
      });
    } catch (error) {
      console.error('Productivity insights error:', error);
      res.status(500).json({ error: 'Failed to analyze productivity patterns' });
    }
  });

  // Achievement System routes
  app.get('/api/achievements/badges', (req: Request, res: Response) => {
    res.json({ badges: ACHIEVEMENT_BADGES });
  });

  app.get('/api/achievements/family-level', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.familyId) {
        return res.status(400).json({ error: 'No family found for user' });
      }

      let familyLevel = await storage.getFamilyLevel(req.user.familyId);
      if (!familyLevel) {
        // Initialize family level if it doesn't exist
        familyLevel = await storage.createOrUpdateFamilyLevel(req.user.familyId, {
          level: 1,
          totalPoints: 0,
          currentLevelPoints: 0,
          pointsToNextLevel: 100
        });
      }

      res.json(familyLevel);
    } catch (error) {
      console.error('Family level fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch family level' });
    }
  });

  app.get('/api/achievements/family-achievements', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.familyId) {
        return res.status(400).json({ error: 'No family found for user' });
      }

      const achievements = await storage.getFamilyAchievements(req.user.familyId);
      const progress = await storage.getAchievementProgress(req.user.familyId);

      res.json({ achievements, progress });
    } catch (error) {
      console.error('Family achievements fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch family achievements' });
    }
  });

  app.post('/api/achievements/check', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.familyId) {
        return res.status(400).json({ error: 'No family found for user' });
      }

      const { action, data } = req.body;

      // Get current family stats
      const tasks = await storage.getTasks(req.user.id, req.user.familyId);
      const familyMembers = await storage.getFamilyMembers(req.user.familyId);
      const currentLevel = await storage.getFamilyLevel(req.user.familyId);

      // Check for new achievements based on the action
      let newBadges: string[] = [];
      
      if (action === 'task_completed') {
        const completedTasks = tasks.filter(t => t.completed);
        newBadges.push(...checkTaskCompletionAchievements(
          {
            familyId: req.user.familyId,
            userId: req.user.id,
            action: 'task_completed',
            timestamp: new Date(),
            data
          },
          completedTasks.length,
          data.completionStreak || 0,
          new Date()
        ));

        newBadges.push(...checkCollaborationAchievements(
          {
            familyId: req.user.familyId,
            userId: req.user.id,
            action: 'task_completed',
            timestamp: new Date()
          },
          completedTasks.length,
          familyMembers.length,
          familyMembers.length
        ));
      }

      // Process new achievements
      const earnedAchievements = [];
      const badgePoints = calculateBadgePoints(newBadges);

      for (const badgeId of newBadges) {
        // Check if already earned
        const existingAchievements = await storage.getFamilyAchievements(req.user.familyId);
        const alreadyEarned = existingAchievements.some(a => a.badgeId === badgeId);
        
        if (!alreadyEarned) {
          const achievement = await storage.createFamilyAchievement({
            familyId: req.user.familyId,
            badgeId,
            unlockedBy: req.user.id,
            metadata: data
          });
          earnedAchievements.push(achievement);
        }
      }

      // Update family level if points were earned
      if (badgePoints > 0) {
        const currentTotalPoints = (currentLevel?.totalPoints || 0) + badgePoints;
        const levelInfo = calculateLevelFromPoints(currentTotalPoints);
        
        await storage.createOrUpdateFamilyLevel(req.user.familyId, {
          level: levelInfo.level,
          totalPoints: currentTotalPoints,
          currentLevelPoints: levelInfo.currentLevelPoints,
          pointsToNextLevel: levelInfo.pointsToNextLevel
        });
      }

      res.json({ 
        newAchievements: earnedAchievements,
        pointsEarned: badgePoints,
        totalNewBadges: newBadges.length
      });
    } catch (error) {
      console.error('Achievement check error:', error);
      res.status(500).json({ error: 'Failed to check achievements' });
    }
  });

  // List routes
  app.get('/api/lists', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const lists = await storage.getLists(req.user!.id, req.user!.familyId);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/lists', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const listData = insertListSchema.parse({
        ...req.body,
        userId: req.user!.id,
        familyId: req.user!.familyId
      });
      const list = await storage.createList(listData);
      res.json(list);
    } catch (error) {
      console.error('List creation error:', error);
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.get('/api/lists/:id/items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const items = await storage.getListItems(id);
      console.log(`Fetching items for list ${id}, found ${items.length} items:`, items.map(i => i.title));
      // Disable all caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('ETag', ''); // Remove ETag to prevent 304 responses
      res.json(items);
    } catch (error) {
      console.error('List items error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/lists/:id/items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const itemData = insertListItemSchema.parse({
        ...req.body,
        listId: id
      });
      const item = await storage.createListItem(itemData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.post('/api/list-items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let itemData = insertListItemSchema.parse(req.body);
      
      // If no category provided and title exists, use AI to categorize
      if (!itemData.category && itemData.title) {
        try {
          const suggestedCategory = await categorizeItem(itemData.title);
          itemData = { ...itemData, category: suggestedCategory };
        } catch (error) {
          console.error('AI categorization failed:', error);
          // Continue without category if AI fails
        }
      }
      
      const item = await storage.createListItem(itemData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  // AI categorization endpoint
  app.post('/api/ai/categorize-item', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      const category = await categorizeItem(title);
      res.json({ category });
    } catch (error) {
      console.error('AI categorization error:', error);
      res.status(500).json({ error: 'Categorization failed' });
    }
  });

  app.patch('/api/list-items/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const item = await storage.updateListItem(id, req.body);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/list-items/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteListItem(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/lists/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteList(id);
      if (!deleted) {
        return res.status(404).json({ error: 'List not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Events routes
  app.get('/api/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const events = await storage.getEvents(req.user!.id, req.user!.familyId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eventData = insertEventSchema.parse({
        ...req.body,
        userId: req.user!.id,
        familyId: req.user!.familyId
      });
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error('Event creation error:', error);
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.delete('/api/events/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEvent(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Event tasks routes
  app.get('/api/events/:id/tasks', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tasks = await storage.getEventTasks(id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/event-tasks', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const taskData = insertEventTaskSchema.parse(req.body);
      const task = await storage.createEventTask(taskData);
      
      // Also create in main tasks system for integration
      const mainTaskData = {
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        status: 'pending',
        dueDate: null,
        category: `Event: ${task.category}`,
        userId: req.user!.id,
        familyId: req.user!.familyId,
      };
      await storage.createTask(mainTaskData);
      
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.patch('/api/event-tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const task = await storage.updateEventTask(id, req.body);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/event-tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEventTask(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Calendar routes
  app.get('/api/calendar/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const events = await storage.getCalendarEvents(req.user!.id, req.user!.familyId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/calendar/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eventData = insertCalendarEventSchema.parse({
        ...req.body,
        userId: req.user!.id,
        familyId: req.user!.familyId
      });
      const event = await storage.createCalendarEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  // Budget routes
  app.get('/api/budget/categories', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const categories = await storage.getBudgetCategories(req.user!.id, req.user!.familyId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/budget/categories', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const categoryData = insertBudgetCategorySchema.parse({
        ...req.body,
        userId: req.user!.id,
        familyId: req.user!.familyId
      });
      const category = await storage.createBudgetCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.delete('/api/budget/categories/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteBudgetCategory(id);
      if (!success) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Budget category deletion error:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  app.get('/api/budget/transactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactions = await storage.getBudgetTransactions(req.user!.id, req.user!.familyId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/budget/transactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactionData = insertBudgetTransactionSchema.parse({
        ...req.body,
        userId: req.user!.id,
        familyId: req.user!.familyId
      });
      const transaction = await storage.createBudgetTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error('Budget transaction error:', error);
      res.status(400).json({ error: 'Invalid input', details: error.message });
    }
  });

  app.put('/api/budget/transactions/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const transaction = await storage.updateBudgetTransaction(id, req.body);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json(transaction);
    } catch (error) {
      console.error('Transaction update error:', error);
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  });

  app.delete('/api/budget/transactions/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteBudgetTransaction(id);
      if (!success) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Transaction deletion error:', error);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  });

  // Chat routes
  app.get('/api/chat/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user!.familyId) {
        return res.status(400).json({ error: 'User not in a family' });
      }
      
      const messages = await storage.getChatMessages(req.user!.familyId);
      
      // Get user info for each message
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          const user = await storage.getUser(message.userId);
          return {
            ...message,
            user: user ? { id: user.id, name: user.name } : null
          };
        })
      );
      
      res.json(messagesWithUsers);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Devotional routes
  app.get('/api/devotional/posts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const posts = await storage.getDevotionalPosts(req.user!.id, req.user!.familyId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/devotional/posts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('Received devotional post data:', req.body);
      
      const postData = insertDevotionalPostSchema.parse({
        ...req.body,
        userId: req.user!.id,
        familyId: req.user!.familyId,
        date: new Date(req.body.date) // Convert string to Date object
      });
      
      console.log('Parsed devotional post data:', postData);
      
      const post = await storage.createDevotionalPost(postData);
      res.json(post);
    } catch (error) {
      console.error('Devotional post creation error:', error);
      res.status(400).json({ error: 'Invalid input', details: error.message });
    }
  });

  app.get('/api/devotional/posts/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const comments = await storage.getDevotionalComments(id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/devotional/posts/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const commentData = insertDevotionalCommentSchema.parse({
        ...req.body,
        postId: id,
        userId: req.user!.id
      });
      const comment = await storage.createDevotionalComment(commentData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.patch('/api/devotional/comments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const comment = await storage.updateDevotionalComment(req.params.id, req.body);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found or unauthorized' });
      }
      res.json(comment);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.delete('/api/devotional/comments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.deleteDevotionalComment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Comment not found or unauthorized' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Event routes
  app.get('/api/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const events = await storage.getEvents(req.user!.id, req.user!.familyId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    console.log('=== EVENT CREATION REQUEST RECEIVED ===');
    try {
      console.log('Received event data:', req.body);
      console.log('User info:', { id: req.user!.id, familyId: req.user!.familyId });
      
      const eventData = insertEventSchema.parse({
        ...req.body,
        userId: req.user!.id,
        familyId: req.user!.familyId
      });
      
      console.log('Parsed event data:', eventData);
      const event = await storage.createEvent(eventData);
      console.log('Created event:', event);
      res.json(event);
    } catch (error: any) {
      console.error('Event creation error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      res.status(400).json({ error: 'Invalid input', details: error.message });
    }
  });

  // Mealie settings routes
  app.get('/api/mealie/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = await storage.getMealieSettings(req.user!.id);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/mealie/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settingsData = insertMealieSettingsSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const settings = await storage.createMealieSettings(settingsData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.patch('/api/mealie/settings/:userId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.params.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const settings = await storage.updateMealieSettings(req.user!.id, req.body);
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  // Mealie integration routes
  app.post('/api/mealie/test-connection', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { instanceUrl, apiKey } = req.body;
      
      if (!instanceUrl || !apiKey) {
        return res.status(400).json({ error: 'Instance URL and API key are required' });
      }

      const { MealieService } = await import('./mealie');
      const mealieService = new MealieService(instanceUrl, apiKey);
      const isConnected = await mealieService.testConnection();
      
      res.json({ connected: isConnected });
    } catch (error) {
      console.error('Mealie connection test error:', error);
      res.status(500).json({ error: 'Failed to test connection' });
    }
  });

  app.get('/api/mealie/recipes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = await storage.getMealieSettings(req.user!.id);
      if (!settings) {
        return res.status(404).json({ error: 'Mealie settings not found' });
      }

      const { MealieService } = await import('./mealie');
      const mealieService = new MealieService(settings.instanceUrl, settings.apiKey);
      
      const page = parseInt(req.query.page as string) || 1;
      const search = req.query.search as string;
      
      let recipes;
      if (search) {
        recipes = await mealieService.searchRecipes(search);
      } else {
        recipes = await mealieService.getRecipes(page);
      }
      
      res.json(recipes);
    } catch (error) {
      console.error('Error fetching Mealie recipes:', error);
      res.status(500).json({ error: 'Failed to fetch recipes from Mealie' });
    }
  });

  app.get('/api/mealie/recipes/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = await storage.getMealieSettings(req.user!.id);
      if (!settings) {
        return res.status(404).json({ error: 'Mealie settings not found' });
      }

      const { MealieService } = await import('./mealie');
      const mealieService = new MealieService(settings.instanceUrl, settings.apiKey);
      const recipe = await mealieService.getRecipe(req.params.id);
      
      res.json(recipe);
    } catch (error) {
      console.error('Error fetching Mealie recipe:', error);
      res.status(500).json({ error: 'Failed to fetch recipe from Mealie' });
    }
  });

  app.post('/api/mealie/import-recipe/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = await storage.getMealieSettings(req.user!.id);
      if (!settings) {
        return res.status(404).json({ error: 'Mealie settings not found' });
      }

      const { MealieService } = await import('./mealie');
      const mealieService = new MealieService(settings.instanceUrl, settings.apiKey);
      
      // Fetch the recipe from Mealie
      const mealieRecipe = await mealieService.getRecipe(req.params.id);
      
      // Convert to our format
      const recipeData = mealieService.convertMealieRecipe(
        mealieRecipe, 
        req.user!.id, 
        req.user!.familyId
      );
      
      // Save to our database
      const savedRecipe = await storage.createRecipe(recipeData);
      
      res.status(201).json(savedRecipe);
    } catch (error) {
      console.error('Error importing Mealie recipe:', error);
      res.status(500).json({ error: 'Failed to import recipe from Mealie' });
    }
  });

  app.post('/api/mealie/sync-recipes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = await storage.getMealieSettings(req.user!.id);
      if (!settings) {
        return res.status(404).json({ error: 'Mealie settings not found' });
      }

      const { MealieService } = await import('./mealie');
      const mealieService = new MealieService(settings.instanceUrl, settings.apiKey);
      
      // Get all recipes from Mealie (with pagination)
      let page = 1;
      const importedRecipes = [];
      let hasMore = true;
      
      while (hasMore) {
        const recipesPage = await mealieService.getRecipes(page, 50);
        
        for (const mealieRecipe of recipesPage.items) {
          try {
            // Check if recipe already exists
            const existingRecipes = await storage.getRecipes(req.user!.id, req.user!.familyId);
            const exists = existingRecipes.some(r => r.mealieId === mealieRecipe.id);
            
            if (!exists) {
              const recipeData = mealieService.convertMealieRecipe(
                mealieRecipe, 
                req.user!.id, 
                req.user!.familyId
              );
              
              const savedRecipe = await storage.createRecipe(recipeData);
              importedRecipes.push(savedRecipe);
            }
          } catch (recipeError) {
            console.error(`Error importing recipe ${mealieRecipe.id}:`, recipeError);
            // Continue with other recipes
          }
        }
        
        hasMore = recipesPage.items.length === 50;
        page++;
      }
      
      // Update last sync time
      await storage.updateMealieSettings(req.user!.id, { 
        lastSync: new Date() 
      });
      
      res.json({ 
        imported: importedRecipes.length,
        recipes: importedRecipes 
      });
    } catch (error) {
      console.error('Error syncing Mealie recipes:', error);
      res.status(500).json({ error: 'Failed to sync recipes from Mealie' });
    }
  });

  // Recipe routes
  app.get('/api/recipes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allRecipes = await storage.getRecipes(req.user!.id, req.user!.familyId);
      res.json(allRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      res.status(500).json({ error: 'Failed to fetch recipes' });
    }
  });

  app.post('/api/recipes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recipeData = insertRecipeSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const recipe = await storage.createRecipe(recipeData);
      res.status(201).json(recipe);
    } catch (error) {
      console.error('Error creating recipe:', error);
      res.status(500).json({ error: 'Failed to create recipe' });
    }
  });

  app.put('/api/recipes/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recipe = await storage.updateRecipe(req.params.id, req.body);
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      res.json(recipe);
    } catch (error) {
      console.error('Error updating recipe:', error);
      res.status(500).json({ error: 'Failed to update recipe' });
    }
  });

  app.delete('/api/recipes/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.deleteRecipe(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      res.status(500).json({ error: 'Failed to delete recipe' });
    }
  });

  // Meal plan routes
  app.get('/api/meal-plans', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const mealPlans = await storage.getMealPlans(req.user!.id, req.user!.familyId);
      res.json(mealPlans);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      res.status(500).json({ error: 'Failed to fetch meal plans' });
    }
  });

  app.post('/api/meal-plans', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const mealPlanData = insertMealPlanSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const mealPlan = await storage.createMealPlan(mealPlanData);
      res.status(201).json(mealPlan);
    } catch (error) {
      console.error('Error creating meal plan:', error);
      res.status(500).json({ error: 'Failed to create meal plan' });
    }
  });

  app.put('/api/meal-plans/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const mealPlan = await storage.updateMealPlan(req.params.id, req.body);
      if (!mealPlan) {
        return res.status(404).json({ error: 'Meal plan not found' });
      }
      res.json(mealPlan);
    } catch (error) {
      console.error('Error updating meal plan:', error);
      res.status(500).json({ error: 'Failed to update meal plan' });
    }
  });

  app.delete('/api/meal-plans/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.deleteMealPlan(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Meal plan not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      res.status(500).json({ error: 'Failed to delete meal plan' });
    }
  });

  // Emoji reaction routes
  app.get('/api/reactions/:targetType/:targetId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetType, targetId } = req.params;
      const reactions = await storage.getEmojiReactions(targetType, targetId);
      
      // Group reactions by emoji and include user info
      const groupedReactions: { [emoji: string]: { count: number; users: string[]; userReacted: boolean } } = {};
      
      for (const reaction of reactions) {
        if (!groupedReactions[reaction.emoji]) {
          groupedReactions[reaction.emoji] = {
            count: 0,
            users: [],
            userReacted: false
          };
        }
        groupedReactions[reaction.emoji].count++;
        groupedReactions[reaction.emoji].users.push(reaction.userId);
        if (reaction.userId === req.user!.id) {
          groupedReactions[reaction.emoji].userReacted = true;
        }
      }
      
      res.json(groupedReactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
      res.status(500).json({ error: 'Failed to fetch reactions' });
    }
  });

  app.post('/api/reactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = insertEmojiReactionSchema.parse({
        ...req.body,
        userId: req.user!.id,
        familyId: req.user!.familyId
      });

      const reaction = await storage.createEmojiReaction(validatedData);
      res.status(201).json(reaction);
    } catch (error) {
      console.error('Error creating reaction:', error);
      res.status(500).json({ error: 'Failed to create reaction' });
    }
  });

  app.delete('/api/reactions/:targetType/:targetId/:emoji', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetType, targetId, emoji } = req.params;
      const success = await storage.deleteEmojiReaction(targetType, targetId, decodeURIComponent(emoji), req.user!.id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Reaction not found' });
      }
    } catch (error) {
      console.error('Error deleting reaction:', error);
      res.status(500).json({ error: 'Failed to delete reaction' });
    }
  });

  // Enhanced AI Integration Routes

  // AI Meal Planning with Calendar & Budget Integration
  app.post('/api/ai/meal-plan', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get budget information
      const budgetItems = await storage.getBudgetItems(req.user!.id, req.user!.familyId);
      const groceryBudget = budgetItems.find(item => 
        item.category.toLowerCase().includes('grocery') || item.category.toLowerCase().includes('food')
      );

      // Get upcoming events
      const events = await storage.getEvents(req.user!.id, req.user!.familyId);
      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        const twoWeeks = new Date();
        twoWeeks.setDate(twoWeeks.getDate() + 14);
        return eventDate <= twoWeeks && eventDate >= new Date();
      });

      // Get current meal plans
      const currentMeals = await storage.getMealPlans(req.user!.id, req.user!.familyId);

      const mealPlanInput = {
        userId: req.user!.id,
        familyId: req.user!.familyId,
        budget: groceryBudget ? {
          monthlyGroceryBudget: groceryBudget.budgeted,
          currentSpending: groceryBudget.budgeted - groceryBudget.remaining,
          upcomingBills: budgetItems.filter(item => item.dueDate).map(item => ({
            name: item.description || item.category,
            amount: item.amount,
            dueDate: new Date(item.dueDate!)
          }))
        } : undefined,
        calendar: {
          upcomingEvents: upcomingEvents.map(event => ({
            title: event.title,
            date: new Date(event.date),
            type: event.type || 'event'
          })),
          busyDays: upcomingEvents
            .filter(event => event.type === 'meeting' || event.type === 'work')
            .map(event => new Date(event.date).toDateString())
        },
        preferences: {
          dietaryRestrictions: [],
          favoriteCuisines: ['Italian', 'Mexican', 'American'],
          cookingSkillLevel: 'intermediate' as const,
          prepTimePreference: '30-45 minutes',
          familySize: 4 // Could be stored in user profile
        },
        currentMeals: currentMeals.map(meal => ({
          title: meal.title,
          date: new Date(meal.date),
          mealType: meal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack'
        }))
      };

      const mealPlan = await generateMealPlan(mealPlanInput);
      res.json(mealPlan);
    } catch (error) {
      console.error('AI meal planning error:', error);
      res.status(500).json({ error: 'Failed to generate AI meal plan' });
    }
  });

  // AI Budget Analysis with Calendar Integration
  app.get('/api/ai/budget-analysis', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const budgetCategories = await storage.getBudgetCategories(req.user!.id, req.user!.familyId);
      const budgetTransactions = await storage.getBudgetTransactions(req.user!.id, req.user!.familyId);
      const events = await storage.getCalendarEvents(req.user!.id, req.user!.familyId);

      // Calculate budget categories
      const categories = budgetCategories.reduce((acc, category) => {
        const transactions = budgetTransactions.filter(t => t.categoryId === category.id);
        const spent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        acc[category.name] = { 
          budgeted: category.budgetAmount || 0, 
          spent: Math.abs(spent)
        };
        return acc;
      }, {} as Record<string, { budgeted: number; spent: number }>);

      const budgetAnalysisInput = {
        userId: req.user!.id,
        familyId: req.user!.familyId,
        currentBudget: {
          totalIncome: Object.values(categories).reduce((sum, cat) => sum + cat.budgeted, 0),
          categories: Object.entries(categories).map(([name, data]) => ({
            name,
            budgeted: data.budgeted,
            spent: data.spent,
            remaining: data.budgeted - data.spent
          }))
        },
        upcomingBills: budgetTransactions
          .filter(t => t.dueDate)
          .map(t => ({
            name: t.description || 'Transaction',
            amount: Math.abs(t.amount || 0),
            dueDate: new Date(t.dueDate!),
            category: budgetCategories.find(c => c.id === t.categoryId)?.name || 'Other',
            recurring: false
          })),
        calendarEvents: events.map(event => ({
          title: event.title,
          date: new Date(event.date),
          type: event.type || 'event',
          estimatedCost: 0 // Could be added to event schema
        }))
      };

      const analysis = await analyzeBudgetWithCalendar(budgetAnalysisInput);
      res.json(analysis);
    } catch (error) {
      console.error('Budget analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze budget' });
    }
  });

  // AI Calendar Insights with Cross-Feature Integration
  app.get('/api/ai/calendar-insights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const events = await storage.getEvents(req.user!.id, req.user!.familyId);
      const tasks = await storage.getTasks(req.user!.id, req.user!.familyId);
      const budgetItems = await storage.getBudgetItems(req.user!.id, req.user!.familyId);
      const mealPlans = await storage.getMealPlans(req.user!.id, req.user!.familyId);

      const calendarAnalysisInput = {
        userId: req.user!.id,
        familyId: req.user!.familyId,
        events: events.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: new Date(event.date),
          type: event.type || 'event',
          attendees: [],
          location: event.location
        })),
        tasks: tasks.map(task => ({
          title: task.title,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          priority: task.priority || 'medium',
          category: task.category || 'general',
          completed: task.completed
        })),
        budget: {
          categories: budgetItems.map(item => ({
            name: item.category,
            remaining: item.remaining
          })),
          upcomingBills: budgetItems
            .filter(item => item.dueDate)
            .map(item => ({
              name: item.description || item.category,
              amount: item.amount,
              dueDate: new Date(item.dueDate!)
            }))
        },
        mealPlan: mealPlans.map(meal => ({
          title: meal.title,
          date: new Date(meal.date),
          mealType: meal.mealType
        }))
      };

      const insights = await generateCalendarInsights(calendarAnalysisInput);
      res.json(insights);
    } catch (error) {
      console.error('Calendar insights error:', error);
      res.status(500).json({ error: 'Failed to generate calendar insights' });
    }
  });

  // AI Budget Alerts
  app.get('/api/ai/budget-alerts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const budgetCategories = await storage.getBudgetCategories(req.user!.id, req.user!.familyId);
      const budgetTransactions = await storage.getBudgetTransactions(req.user!.id, req.user!.familyId);

      const categories = budgetCategories.reduce((acc, category) => {
        const transactions = budgetTransactions.filter(t => t.categoryId === category.id);
        const spent = transactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
        acc[category.name] = { 
          budgeted: category.budgetAmount || 0, 
          spent: spent
        };
        return acc;
      }, {} as Record<string, { budgeted: number; spent: number }>);

      const budgetAlertsInput = {
        userId: req.user!.id,
        familyId: req.user!.familyId,
        currentBudget: {
          totalIncome: Object.values(categories).reduce((sum, cat) => sum + cat.budgeted, 0),
          categories: Object.entries(categories).map(([name, data]) => ({
            name,
            budgeted: data.budgeted,
            spent: data.spent,
            remaining: data.budgeted - data.spent
          }))
        },
        upcomingBills: budgetTransactions
          .filter(t => t.dueDate)
          .map(t => ({
            name: t.description || 'Bill',
            amount: Math.abs(t.amount || 0),
            dueDate: new Date(t.dueDate!),
            category: budgetCategories.find(c => c.id === t.categoryId)?.name || 'Other',
            recurring: false
          }))
      };

      const alerts = await generateBudgetAlerts(budgetAlertsInput);
      res.json(alerts);
    } catch (error) {
      console.error('Budget alerts error:', error);
      res.status(500).json({ error: 'Failed to generate budget alerts' });
    }
  });

  // AI Event Assistant Routes

  // Generate comprehensive event planning suggestions
  app.post('/api/ai/event-suggestions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventTitle, eventType, eventDate, attendeeCount, budget, location, description } = req.body;
      
      // Get existing context
      const tasks = await storage.getTasks(req.user!.id, req.user!.familyId);
      const lists = await storage.getLists(req.user!.id, req.user!.familyId);

      const eventContext = {
        eventTitle,
        eventType,
        eventDate: new Date(eventDate),
        attendeeCount,
        budget,
        location,
        description,
        familySize: 4, // Could be stored in user profile
        existingTasks: tasks.filter(t => !t.completed).map(t => t.title),
        existingLists: lists.map(l => l.title)
      };

      const suggestions = await generateEventSuggestions(eventContext);
      res.json(suggestions);
    } catch (error) {
      console.error('Event suggestions error:', error);
      res.status(500).json({ error: 'Failed to generate event suggestions' });
    }
  });

  // Create tasks and lists from event suggestions
  app.post('/api/ai/create-event-items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tasks, shoppingLists, eventId } = req.body;
      const createdItems = { tasks: [], lists: [] };

      // Create tasks
      if (tasks && tasks.length > 0) {
        for (const taskData of tasks) {
          try {
            const task = await storage.createTask({
              title: taskData.title,
              description: taskData.description,
              category: taskData.category,
              priority: taskData.priority,
              dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined,
              userId: req.user!.id,
              familyId: req.user!.familyId,
              completed: false,
              assignedTo: null,
              relatedEventId: eventId
            });
            (createdItems.tasks as any[]).push(task);
          } catch (taskError) {
            console.error('Error creating task:', taskError);
          }
        }
      }

      // Create shopping lists
      if (shoppingLists && shoppingLists.length > 0) {
        for (const listData of shoppingLists) {
          try {
            const list = await storage.createList({
              title: listData.title,
              category: listData.category,
              description: `Auto-generated for event planning - Budget: $${listData.estimatedBudget}`,
              userId: req.user!.id,
              familyId: req.user!.familyId,
              isShared: true,
              relatedEventId: eventId
            });

            // Add items to the list
            if (listData.items && listData.items.length > 0) {
              for (const itemData of listData.items) {
                try {
                  await storage.createListItem({
                    title: itemData.name,
                    description: itemData.quantity ? `Quantity: ${itemData.quantity}` : undefined,
                    listId: list.id,
                    userId: req.user!.id,
                    completed: false,
                    priority: itemData.priority,
                    category: itemData.category
                  });
                } catch (itemError) {
                  console.error('Error creating list item:', itemError);
                }
              }
            }

            (createdItems.lists as any[]).push(list);
          } catch (listError) {
            console.error('Error creating list:', listError);
          }
        }
      }

      res.json(createdItems);
    } catch (error) {
      console.error('Create event items error:', error);
      res.status(500).json({ error: 'Failed to create event items' });
    }
  });

  // Get event type templates
  app.get('/api/ai/event-templates/:eventType', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventType } = req.params;
      const template = await generateEventTypeTemplates(eventType);
      res.json(template);
    } catch (error) {
      console.error('Event template error:', error);
      res.status(500).json({ error: 'Failed to generate event template' });
    }
  });

  // Get quick suggestions for last-minute events
  app.post('/api/ai/quick-event-suggestions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventType, daysUntilEvent } = req.body;
      const suggestions = await generateQuickEventSuggestions(eventType, daysUntilEvent);
      res.json(suggestions);
    } catch (error) {
      console.error('Quick suggestions error:', error);
      res.status(500).json({ error: 'Failed to generate quick suggestions' });
    }
  });

  // AI Devotional Generator Routes

  // Generate daily devotional
  app.post('/api/ai/daily-devotional', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('=== DAILY DEVOTIONAL REQUEST ===');
      console.log('User:', req.user?.id);
      console.log('Request body:', req.body);
      
      const { theme, familySize, childrenAges, marriageYears, specificNeeds } = req.body;
      
      const devotionalRequest = {
        theme: theme || 'general',
        familySize,
        childrenAges,
        marriageYears,
        specificNeeds,
        previousTopics: [] // Could track user's recent devotionals
      };

      console.log('Calling generateDailyDevotional with:', devotionalRequest);
      const devotional = await generateDailyDevotional(devotionalRequest);
      console.log('Generated devotional successfully:', devotional.title);
      console.log('Sending devotional response:', JSON.stringify(devotional, null, 2));
      res.json(devotional);
    } catch (error: any) {
      console.error('=== DAILY DEVOTIONAL ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to generate daily devotional',
        details: error.message 
      });
    }
  });

  // Generate weekly devotional plan
  app.post('/api/ai/weekly-devotional-plan', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { theme, familySize, childrenAges, marriageYears, specificNeeds } = req.body;
      
      const devotionalRequest = {
        theme: theme || 'family',
        familySize,
        childrenAges,
        marriageYears,
        specificNeeds,
        previousTopics: []
      };

      const weeklyPlan = await generateWeeklyDevotionalPlan(devotionalRequest);
      res.json(weeklyPlan);
    } catch (error) {
      console.error('Weekly devotional plan error:', error);
      res.status(500).json({ error: 'Failed to generate weekly devotional plan' });
    }
  });

  // Generate topical devotional
  app.post('/api/ai/topical-devotional', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { topic, additionalContext } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      const devotional = await generateTopicalDevotional(topic, additionalContext);
      res.json(devotional);
    } catch (error) {
      console.error('Topical devotional error:', error);
      res.status(500).json({ error: 'Failed to generate topical devotional' });
    }
  });

  // Get devotional suggestions
  app.post('/api/ai/devotional-suggestions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { theme, recentChallenges, familySize, childrenAges } = req.body;
      
      const familyProfile = {
        theme,
        recentChallenges,
        familySize,
        childrenAges
      };

      const suggestions = await generateDevotionalSuggestions(familyProfile);
      res.json(suggestions);
    } catch (error) {
      console.error('Devotional suggestions error:', error);
      res.status(500).json({ error: 'Failed to generate devotional suggestions' });
    }
  });

  // Save devotional to user's collection
  app.post('/api/devotionals/save', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('Saving devotional:', req.body);
      
      // Transform AI devotional format to database schema
      const devotionalData = {
        title: req.body.title,
        reading: req.body.bibleVerse ? `${req.body.bibleVerse.text} - ${req.body.bibleVerse.reference}` : null,
        topic: req.body.theme || null,
        questions: req.body.discussion ? JSON.stringify(req.body.discussion) : null,
        prayer: req.body.prayer || null,
        date: new Date(req.body.date || new Date().toISOString()),
        userId: req.user!.id,
        familyId: req.user!.familyId || null,
      };

      const savedDevotional = await storage.createDevotionalPost(devotionalData);
      console.log('Devotional saved to database:', savedDevotional.id);
      
      res.json({ 
        success: true, 
        message: 'Devotional saved successfully',
        devotional: savedDevotional 
      });
    } catch (error) {
      console.error('Save devotional error:', error);
      res.status(500).json({ error: 'Failed to save devotional' });
    }
  });

  // AI Family Assistant routes
  app.post('/api/ai/assistant', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const user = req.user!;
      const family = user.familyId ? await storage.getFamily(user.familyId) : null;
      
      const context = {
        userId: user.id,
        familyId: user.familyId,
        userName: user.name,
        familyName: family?.name
      };

      const { processAssistantRequest, executeAssistantAction } = await import('./ai-family-assistant');
      const response = await processAssistantRequest(message, context);
      
      // Execute any actions that were suggested
      if (response.actions && response.actions.length > 0) {
        const actionResults = [];
        for (const action of response.actions) {
          try {
            console.log('Executing action:', action);
            const result = await executeAssistantAction(action, context);
            actionResults.push({ action: action.type, success: true, result });
          } catch (error) {
            console.error('Failed to execute action:', action, error);
            actionResults.push({ action: action.type, success: false, error: error.message });
          }
        }
        response.actionResults = actionResults;
      }
      
      res.json(response);
    } catch (error) {
      console.error('AI Assistant error:', error);
      res.status(500).json({ error: 'Failed to process assistant request' });
    }
  });

  app.post('/api/ai/assistant/execute', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { action } = req.body;
      
      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      const user = req.user!;
      const family = user.familyId ? await storage.getFamily(user.familyId) : null;
      
      const context = {
        userId: user.id,
        familyId: user.familyId,
        userName: user.name,
        familyName: family?.name
      };

      const { executeAssistantAction } = await import('./ai-family-assistant');
      const result = await executeAssistantAction(action, context);
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Action execution error:', error);
      res.status(500).json({ error: 'Failed to execute action' });
    }
  });

  return httpServer;
}
