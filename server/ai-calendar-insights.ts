import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface CalendarAnalysisInput {
  userId: string;
  familyId?: string;
  events: Array<{
    id: string;
    title: string;
    description?: string;
    date: Date;
    duration?: string;
    type: string;
    attendees?: string[];
    location?: string;
  }>;
  tasks: Array<{
    title: string;
    dueDate?: Date;
    priority: string;
    category: string;
    completed: boolean;
  }>;
  budget?: {
    categories: Array<{
      name: string;
      remaining: number;
    }>;
    upcomingBills: Array<{
      name: string;
      amount: number;
      dueDate: Date;
    }>;
  };
  mealPlan?: Array<{
    title: string;
    date: Date;
    mealType: string;
    prepTime?: string;
  }>;
}

interface CalendarInsight {
  type: 'scheduling' | 'preparation' | 'conflict' | 'optimization' | 'budget_impact';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedActions: string[];
  affectedDates: Date[];
  relatedItems?: Array<{
    type: 'event' | 'task' | 'meal' | 'bill';
    title: string;
    date: Date;
  }>;
}

export async function generateCalendarInsights(input: CalendarAnalysisInput): Promise<{
  insights: CalendarInsight[];
  weeklyOverview: {
    busyDays: string[];
    freeDays: string[];
    conflictAlerts: Array<{
      date: Date;
      description: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
  smartSuggestions: {
    taskScheduling: Array<{
      taskTitle: string;
      suggestedDate: Date;
      reasoning: string;
    }>;
    mealPrepTiming: Array<{
      mealTitle: string;
      prepSuggestion: string;
      reasoning: string;
    }>;
    budgetTimings: Array<{
      action: string;
      timing: string;
      reasoning: string;
    }>;
  };
}> {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingEvents = input.events.filter(event => 
      event.date >= now && event.date <= nextWeek
    );

    const pendingTasks = input.tasks.filter(task => 
      !task.completed && (!task.dueDate || task.dueDate >= now)
    );

    const upcomingMeals = input.mealPlan?.filter(meal => 
      meal.date >= now && meal.date <= nextWeek
    ) || [];

    const upcomingBills = input.budget?.upcomingBills.filter(bill => 
      bill.dueDate >= now && bill.dueDate <= nextWeek
    ) || [];

    const prompt = `You are an AI calendar optimization expert. Analyze the family's schedule and provide intelligent insights for better time management, considering events, tasks, meals, and budget obligations.

UPCOMING EVENTS (Next 7 days):
${upcomingEvents.map(event => 
  `- ${event.title} on ${event.date.toDateString()} at ${event.date.toTimeString()} (${event.type})`
).join('\n') || 'No events scheduled'}

PENDING TASKS:
${pendingTasks.map(task => 
  `- ${task.title} (${task.priority} priority, ${task.category}) ${task.dueDate ? 'due ' + task.dueDate.toDateString() : 'no due date'}`
).join('\n') || 'No pending tasks'}

MEAL PLAN:
${upcomingMeals.map(meal => 
  `- ${meal.title} (${meal.mealType}) on ${meal.date.toDateString()} ${meal.prepTime ? '- prep time: ' + meal.prepTime : ''}`
).join('\n') || 'No meals planned'}

UPCOMING BILLS:
${upcomingBills.map(bill => 
  `- ${bill.name}: $${bill.amount} due ${bill.dueDate.toDateString()}`
).join('\n') || 'No bills due'}

BUDGET STATUS:
${input.budget?.categories.map(cat => 
  `- ${cat.name}: $${cat.remaining} remaining`
).join('\n') || 'No budget information'}

ANALYSIS REQUIREMENTS:
1. Identify scheduling conflicts and time overlaps
2. Suggest optimal timing for task completion
3. Recommend meal prep schedules around busy events
4. Alert about bill due dates conflicting with events
5. Suggest budget-conscious timing for activities
6. Identify free time slots for family activities
7. Warn about overpacked days
8. Recommend preparation time for events
9. Suggest batch activities (shopping, meal prep)
10. Optimize travel/location logistics

Generate comprehensive calendar insights with cross-feature integration.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  priority: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  suggestedActions: { type: "array", items: { type: "string" } },
                  affectedDates: { type: "array", items: { type: "string" } },
                  relatedItems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        title: { type: "string" },
                        date: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            weeklyOverview: {
              type: "object",
              properties: {
                busyDays: { type: "array", items: { type: "string" } },
                freeDays: { type: "array", items: { type: "string" } },
                conflictAlerts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string" }
                    }
                  }
                }
              }
            },
            smartSuggestions: {
              type: "object",
              properties: {
                taskScheduling: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      taskTitle: { type: "string" },
                      suggestedDate: { type: "string" },
                      reasoning: { type: "string" }
                    }
                  }
                },
                mealPrepTiming: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      mealTitle: { type: "string" },
                      prepSuggestion: { type: "string" },
                      reasoning: { type: "string" }
                    }
                  }
                },
                budgetTimings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      timing: { type: "string" },
                      reasoning: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      insights: result.insights?.map((insight: any) => ({
        ...insight,
        affectedDates: insight.affectedDates?.map((date: string) => new Date(date)) || [],
        relatedItems: insight.relatedItems?.map((item: any) => ({
          ...item,
          date: new Date(item.date)
        })) || []
      })) || [],
      weeklyOverview: {
        busyDays: result.weeklyOverview?.busyDays || [],
        freeDays: result.weeklyOverview?.freeDays || [],
        conflictAlerts: result.weeklyOverview?.conflictAlerts?.map((alert: any) => ({
          ...alert,
          date: new Date(alert.date)
        })) || []
      },
      smartSuggestions: {
        taskScheduling: result.smartSuggestions?.taskScheduling?.map((suggestion: any) => ({
          ...suggestion,
          suggestedDate: new Date(suggestion.suggestedDate)
        })) || [],
        mealPrepTiming: result.smartSuggestions?.mealPrepTiming || [],
        budgetTimings: result.smartSuggestions?.budgetTimings || []
      }
    };
  } catch (error) {
    console.error("Error generating calendar insights:", error);
    throw new Error("Failed to generate calendar insights");
  }
}

export async function generateEventPreparationTips(
  event: { title: string; date: Date; type: string; description?: string },
  context: { budget?: number; familySize?: number; tasks?: string[] }
): Promise<{
  preparationTasks: Array<{
    task: string;
    timing: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: string;
  }>;
  budgetConsiderations: string[];
  shoppingList?: string[];
}> {
  try {
    const daysUntilEvent = Math.ceil((event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const prompt = `Generate preparation recommendations for this upcoming event.

EVENT DETAILS:
- Title: ${event.title}
- Date: ${event.date.toDateString()}
- Type: ${event.type}
- Description: ${event.description || 'No description'}
- Days until event: ${daysUntilEvent}

CONTEXT:
- Available budget: ${context.budget ? '$' + context.budget : 'Not specified'}
- Family size: ${context.familySize || 'Not specified'}
- Current tasks: ${context.tasks?.join(', ') || 'None'}

Provide practical preparation recommendations with timing and priorities.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            preparationTasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task: { type: "string" },
                  timing: { type: "string" },
                  priority: { type: "string" },
                  estimatedTime: { type: "string" }
                }
              }
            },
            budgetConsiderations: { type: "array", items: { type: "string" } },
            shoppingList: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating event preparation tips:", error);
    return {
      preparationTasks: [],
      budgetConsiderations: [],
      shoppingList: []
    };
  }
}