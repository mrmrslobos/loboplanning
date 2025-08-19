import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface EventContext {
  eventTitle: string;
  eventType: string;
  eventDate: Date;
  attendeeCount?: number;
  budget?: number;
  location?: string;
  description?: string;
  familySize?: number;
  existingTasks?: string[];
  existingLists?: string[];
}

interface EventSuggestion {
  tasks: Array<{
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    estimatedTime: string;
    assignable: boolean;
  }>;
  shoppingLists: Array<{
    title: string;
    category: string;
    items: Array<{
      name: string;
      quantity?: string;
      priority: 'essential' | 'preferred' | 'optional';
      estimatedCost?: number;
      category: string;
    }>;
    estimatedBudget: number;
  }>;
  timeline: Array<{
    timeframe: string;
    activities: string[];
    deadline: Date;
  }>;
  budgetBreakdown: {
    categories: Array<{
      name: string;
      estimatedCost: number;
      items: string[];
    }>;
    totalEstimated: number;
    savingsTips: string[];
  };
  preparation: {
    earlyPrep: string[];
    dayBeforePrep: string[];
    dayOfPrep: string[];
    contingencyPlans: string[];
  };
}

export async function generateEventSuggestions(context: EventContext): Promise<EventSuggestion> {
  try {
    const daysUntilEvent = Math.ceil((context.eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    const prompt = `You are an AI event planning assistant. Generate comprehensive suggestions for organizing this event, including tasks, shopping lists, timeline, and budget.

EVENT DETAILS:
- Title: ${context.eventTitle}
- Type: ${context.eventType}
- Date: ${context.eventDate.toDateString()}
- Days until event: ${daysUntilEvent}
- Expected attendees: ${context.attendeeCount || 'Not specified'}
- Budget: ${context.budget ? '$' + context.budget : 'Not specified'}
- Location: ${context.location || 'Not specified'}
- Description: ${context.description || 'None provided'}
- Family size: ${context.familySize || 'Not specified'}

EXISTING CONTEXT:
- Current tasks: ${context.existingTasks?.join(', ') || 'None'}
- Current lists: ${context.existingLists?.join(', ') || 'None'}

PLANNING REQUIREMENTS:
1. Create actionable tasks with appropriate timing
2. Generate shopping lists organized by category
3. Provide timeline with clear deadlines
4. Estimate realistic budget breakdown
5. Include preparation steps for different phases
6. Consider family collaboration opportunities
7. Suggest contingency plans
8. Factor in lead times for bookings/orders
9. Include both essential and optional items
10. Provide money-saving tips

Generate comprehensive event planning suggestions tailored to this specific event type and context.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  priority: { type: "string" },
                  dueDate: { type: "string" },
                  estimatedTime: { type: "string" },
                  assignable: { type: "boolean" }
                }
              }
            },
            shoppingLists: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  category: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        quantity: { type: "string" },
                        priority: { type: "string" },
                        estimatedCost: { type: "number" },
                        category: { type: "string" }
                      }
                    }
                  },
                  estimatedBudget: { type: "number" }
                }
              }
            },
            timeline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timeframe: { type: "string" },
                  activities: { type: "array", items: { type: "string" } },
                  deadline: { type: "string" }
                }
              }
            },
            budgetBreakdown: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      estimatedCost: { type: "number" },
                      items: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                totalEstimated: { type: "number" },
                savingsTips: { type: "array", items: { type: "string" } }
              }
            },
            preparation: {
              type: "object",
              properties: {
                earlyPrep: { type: "array", items: { type: "string" } },
                dayBeforePrep: { type: "array", items: { type: "string" } },
                dayOfPrep: { type: "array", items: { type: "string" } },
                contingencyPlans: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    
    // Process dates in timeline
    const processedTimeline = result.timeline?.map((item: any) => ({
      ...item,
      deadline: new Date(item.deadline)
    })) || [];

    // Process due dates in tasks
    const processedTasks = result.tasks?.map((task: any) => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined
    })) || [];

    return {
      tasks: processedTasks,
      shoppingLists: result.shoppingLists || [],
      timeline: processedTimeline,
      budgetBreakdown: result.budgetBreakdown || {
        categories: [],
        totalEstimated: 0,
        savingsTips: []
      },
      preparation: result.preparation || {
        earlyPrep: [],
        dayBeforePrep: [],
        dayOfPrep: [],
        contingencyPlans: []
      }
    };
  } catch (error) {
    console.error("Error generating event suggestions:", error);
    throw new Error("Failed to generate event planning suggestions");
  }
}

export async function generateEventTypeTemplates(eventType: string): Promise<{
  commonTasks: string[];
  essentialSupplies: string[];
  budgetCategories: string[];
  timelineTemplate: Array<{
    phase: string;
    description: string;
    daysBeforeEvent: number;
  }>;
}> {
  try {
    const prompt = `Generate a template for ${eventType} events with common tasks, supplies, and timeline.

EVENT TYPE: ${eventType}

Provide:
1. Common tasks typically needed for this event type
2. Essential supplies usually required
3. Budget categories to consider
4. Timeline template with phases and timing

Focus on practical, actionable items that families typically need for this type of event.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            commonTasks: { type: "array", items: { type: "string" } },
            essentialSupplies: { type: "array", items: { type: "string" } },
            budgetCategories: { type: "array", items: { type: "string" } },
            timelineTemplate: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  description: { type: "string" },
                  daysBeforeEvent: { type: "number" }
                }
              }
            }
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating event template:", error);
    return {
      commonTasks: [],
      essentialSupplies: [],
      budgetCategories: [],
      timelineTemplate: []
    };
  }
}

export async function generateQuickEventSuggestions(eventType: string, daysUntilEvent: number): Promise<{
  urgentTasks: string[];
  quickShoppingList: string[];
  timeManagementTips: string[];
}> {
  try {
    const prompt = `Generate quick suggestions for a ${eventType} event happening in ${daysUntilEvent} days.

Focus on:
1. Most urgent tasks that need immediate attention
2. Essential items to purchase/prepare quickly
3. Time management tips for short preparation time

Keep suggestions practical and achievable within the available timeframe.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            urgentTasks: { type: "array", items: { type: "string" } },
            quickShoppingList: { type: "array", items: { type: "string" } },
            timeManagementTips: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating quick suggestions:", error);
    return {
      urgentTasks: [],
      quickShoppingList: [],
      timeManagementTips: []
    };
  }
}