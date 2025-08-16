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

  // Auth routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
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
      res.status(400).json({ error: 'Invalid input' });
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
      
      // Update user's familyId
      await storage.updateUser(req.user!.id, { familyId: family.id });
      
      res.json(family);
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
      res.json(items);
    } catch (error) {
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
      const itemData = insertListItemSchema.parse(req.body);
      const item = await storage.createListItem(itemData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
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
      res.status(400).json({ error: 'Invalid input' });
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
    } catch (error) {
      console.error('Event creation error:', error);
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

  return httpServer;
}
