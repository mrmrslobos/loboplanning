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
  insertDevotionalCommentSchema, insertEventSchema, insertEventGuestSchema,
  insertEventTaskSchema, insertEventBudgetSchema, insertMealieSettingsSchema
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
          familyConnections.get(userFamilyId)!.add(ws);
          
          // Send online count update
          const connections = familyConnections.get(userFamilyId)!;
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
      } catch (error) {
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
        userId: req.user!.id
      });
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
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
        userId: req.user!.id
      });
      const list = await storage.createList(listData);
      res.json(list);
    } catch (error) {
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
        userId: req.user!.id
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
        userId: req.user!.id
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
        userId: req.user!.id
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
      const eventData = insertEventSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
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

  return httpServer;
}
