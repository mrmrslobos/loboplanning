import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AssistantContext {
  userId: string;
  familyId?: string | null;
  userName: string;
  familyName?: string;
}

export interface AssistantResponse {
  message: string;
  actions?: Array<{
    type: 'create_task' | 'create_event' | 'add_budget_transaction' | 'create_list' | 'generate_devotional';
    data: any;
    description: string;
  }>;
  suggestions?: string[];
}

export async function processAssistantRequest(
  message: string, 
  context: AssistantContext
): Promise<AssistantResponse> {
  try {
    // Get current family data for context
    const [tasks, events, budgetCategories, lists, devotionalPosts] = await Promise.all([
      storage.getTasks(context.userId, context.familyId || undefined),
      storage.getCalendarEvents(context.userId, context.familyId || undefined),
      storage.getBudgetCategories(context.userId, context.familyId || undefined),
      storage.getLists(context.userId, context.familyId || undefined),
      storage.getDevotionalPosts(context.userId, context.familyId || undefined)
    ]);

    const systemPrompt = `You are an AI Family Assistant for LoboHub, a comprehensive family management platform. You help families manage tasks, calendars, budgets, meal planning, and devotionals.

USER CONTEXT:
- User: ${context.userName}
- Family: ${context.familyName || 'Personal'}
- Current Tasks: ${tasks.length} active tasks
- Upcoming Events: ${events.length} scheduled events  
- Budget Categories: ${budgetCategories.length} categories
- Lists: ${lists.length} active lists
- Saved Devotionals: ${devotionalPosts.length} devotionals

CAPABILITIES:
You can help with:
1. Task management (create, organize, prioritize)
2. Calendar scheduling (add events, find free time)
3. Budget tracking (add expenses, analyze spending)
4. List management (shopping, to-do, packing lists)
5. Devotional guidance (suggest topics, create plans)
6. Family coordination (suggestions for activities)

RESPONSE FORMAT:
Always respond in JSON format with:
{
  "message": "Conversational response to user",
  "actions": [optional array of actions to perform],
  "suggestions": [optional array of helpful suggestions]
}

ACTIONS you can suggest:
- create_task: {title, description, dueDate?, assignedTo, category?}
- create_event: {title, description, startTime, endTime, location?}
- add_budget_transaction: {description, amount, categoryId, type: 'expense'|'income'}
- create_list: {title, description, category, template}
- add_list_item: {listId, text}
- generate_devotional: {theme, familySize?, childrenAges?, specificNeeds?}

EXISTING LISTS: ${lists.map(l => `${l.title} (id: ${l.id})`).join(', ')}

CURRENT DATA CONTEXT:
Recent Tasks: ${tasks.slice(0, 3).map(t => `"${t.title}" (${t.status})`).join(', ')}
Recent Events: ${events.slice(0, 2).map(e => `"${e.title}" on ${new Date(e.startTime).toLocaleDateString()}`).join(', ')}
Budget Categories: ${budgetCategories.map(c => c.name).join(', ')}

Be helpful, family-friendly, and proactive in suggestions. Always maintain a warm, supportive tone.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      },
      contents: message,
    });

    const rawJson = response.text;
    console.log(`AI Assistant Response: ${rawJson}`);

    if (rawJson) {
      const assistantResponse: AssistantResponse = JSON.parse(rawJson);
      return assistantResponse;
    } else {
      throw new Error("Empty response from AI assistant");
    }
  } catch (error) {
    console.error('AI Assistant error:', error);
    throw new Error(`Failed to process assistant request: ${error}`);
  }
}

export async function executeAssistantAction(
  action: any,
  context: AssistantContext
): Promise<any> {
  try {
    // Handle different action formats
    let actionType = action.type || action.action || action.action_type;
    let actionData = action.data || action;
    
    // If no type field, check if the action object has the type as a key
    if (!actionType) {
      const keys = Object.keys(action);
      if (keys.length === 1) {
        actionType = keys[0];
        actionData = action[actionType];
      }
    }
    
    // For flat action structures, use the action itself as data
    if (!action.data && actionType) {
      actionData = { ...action };
      delete actionData.type;
      delete actionData.action;
      delete actionData.action_type;
    }
    
    console.log('Processing action type:', actionType, 'with data:', actionData);

    switch (actionType) {
      case 'create_task':
        const taskData = {
          ...actionData,
          userId: context.userId,
          familyId: context.familyId || null
        };
        return await storage.createTask(taskData);

      case 'create_event':
        const eventData = {
          ...actionData,
          startTime: new Date(actionData.startTime),
          endTime: new Date(actionData.endTime),
          userId: context.userId,
          familyId: context.familyId || null
        };
        return await storage.createCalendarEvent(eventData);

      case 'add_budget_transaction':
        const transactionData = {
          ...actionData,
          date: new Date(),
          userId: context.userId,
          familyId: context.familyId || null
        };
        return await storage.createBudgetTransaction(transactionData);

      case 'create_list':
        const listData = {
          title: actionData.title,
          category: actionData.category || 'General',
          template: actionData.template || 'general',
          userId: context.userId,
          familyId: context.familyId || null
        };
        const newList = await storage.createList(listData);
        
        // Parse items from description and add them to the list
        if (actionData.description) {
          const items = actionData.description.split('\n').filter(item => item.trim());
          for (const itemText of items) {
            const itemData = {
              text: itemText.trim(),
              completed: false,
              listId: newList.id,
              userId: context.userId,
              familyId: context.familyId || null
            };
            await storage.createListItem(itemData);
          }
        }
        
        return newList;

      case 'add_list_item':
        // Handle nested action data structure
        const listItemInfo = actionData.add_list_item || actionData;
        const itemData = {
          text: listItemInfo.text,
          completed: false,
          listId: listItemInfo.listId,
          userId: context.userId,
          familyId: context.familyId || null
        };
        console.log('Creating list item with data:', itemData);
        return await storage.createListItem(itemData);

      default:
        throw new Error(`Unknown action type: ${actionType}. Available actions: create_task, create_event, add_budget_transaction, create_list, add_list_item`);
    }
  } catch (error) {
    console.error('Action execution error:', error);
    throw error;
  }
}

// Quick response suggestions for common requests
export const quickSuggestions = [
  "What tasks should I focus on today?",
  "Help me plan dinner for this week",
  "Add groceries to my shopping list",
  "Schedule family time this weekend",
  "How are we doing with our budget this month?",
  "Generate a devotional for our family",
  "What's coming up on our calendar?",
  "Create a task to call mom"
];