import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface TaskRecommendationInput {
  userId: string;
  recentTasks: Array<{
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    completed: boolean;
    completedAt?: Date;
    createdAt: Date;
  }>;
  upcomingEvents?: Array<{
    title: string;
    date: Date;
    description?: string;
  }>;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: string;
  userPreferences?: {
    workingHours?: string;
    categories?: string[];
    productivityStyle?: string;
  };
}

interface TaskRecommendation {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: string;
  reasoning: string;
  bestTimeToComplete: string;
}

export async function generateTaskRecommendations(
  input: TaskRecommendationInput
): Promise<TaskRecommendation[]> {
  try {
    const recentCompletedTasks = input.recentTasks
      .filter(task => task.completed)
      .slice(0, 10)
      .map(task => `"${task.title}" (${task.category}) - completed on ${task.completedAt?.toLocaleDateString()}`);

    const recentPendingTasks = input.recentTasks
      .filter(task => !task.completed)
      .slice(0, 10)
      .map(task => `"${task.title}" (${task.category}, priority: ${task.priority})`);

    const upcomingEventsText = input.upcomingEvents
      ?.slice(0, 5)
      .map(event => `"${event.title}" on ${event.date.toLocaleDateString()}`)
      .join(", ") || "None";

    const prompt = `You are an AI task management assistant. Based on the user's task history and current context, suggest 3-5 personalized tasks that would be valuable and relevant.

Current Context:
- Time: ${input.timeOfDay} on ${input.dayOfWeek}
- Recent completed tasks: ${recentCompletedTasks.join(", ") || "None"}
- Current pending tasks: ${recentPendingTasks.join(", ") || "None"}
- Upcoming events: ${upcomingEventsText}

User Preferences:
- Working hours: ${input.userPreferences?.workingHours || "Not specified"}
- Preferred categories: ${input.userPreferences?.categories?.join(", ") || "Not specified"}
- Productivity style: ${input.userPreferences?.productivityStyle || "Not specified"}

Guidelines for recommendations:
1. Consider the time of day and suggest appropriate tasks
2. Look for patterns in completed tasks to understand user preferences
3. Suggest tasks that complement pending work
4. Consider upcoming events and suggest preparatory tasks
5. Mix different priorities and durations
6. Avoid duplicating existing pending tasks
7. Make tasks specific and actionable

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "title": "Clear and specific task title",
      "description": "Detailed description of what needs to be done",
      "category": "Work|Personal|Health|Learning|Household|Family",
      "priority": "low|medium|high",
      "estimatedDuration": "15 minutes|30 minutes|1 hour|2 hours",
      "reasoning": "Why this task is recommended right now",
      "bestTimeToComplete": "Now|Later today|This week|Weekend"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  priority: { type: "string" },
                  estimatedDuration: { type: "string" },
                  reasoning: { type: "string" },
                  bestTimeToComplete: { type: "string" }
                },
                required: ["title", "description", "category", "priority", "estimatedDuration", "reasoning", "bestTimeToComplete"]
              }
            }
          },
          required: ["recommendations"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result.recommendations || [];
  } catch (error) {
    console.error("Error generating task recommendations:", error);
    return [];
  }
}

export async function analyzeProductivityPatterns(
  tasks: Array<{
    title: string;
    category?: string;
    priority?: string;
    completed: boolean;
    completedAt?: Date;
    createdAt: Date;
  }>
): Promise<{
  productiveHours: string[];
  preferredCategories: string[];
  completionRate: number;
  averageTaskDuration: string;
  recommendations: string[];
}> {
  try {
    const completedTasks = tasks.filter(task => task.completed);
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    const tasksByCategory = tasks.reduce((acc, task) => {
      const category = task.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `Analyze this user's task completion patterns and provide insights:

Task Statistics:
- Total tasks: ${tasks.length}
- Completed tasks: ${completedTasks.length}
- Completion rate: ${completionRate.toFixed(1)}%
- Tasks by category: ${JSON.stringify(tasksByCategory)}

Recent completed tasks with timestamps:
${completedTasks.slice(0, 20).map(task => 
  `"${task.title}" (${task.category}) - completed at ${task.completedAt?.toISOString()}`
).join('\n')}

Analyze and provide insights in JSON format:
{
  "productiveHours": ["morning", "afternoon", "evening"],
  "preferredCategories": ["category1", "category2"],
  "completionRate": ${completionRate},
  "averageTaskDuration": "estimated duration",
  "recommendations": [
    "insight or recommendation 1",
    "insight or recommendation 2",
    "insight or recommendation 3"
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            productiveHours: {
              type: "array",
              items: { type: "string" }
            },
            preferredCategories: {
              type: "array",
              items: { type: "string" }
            },
            completionRate: { type: "number" },
            averageTaskDuration: { type: "string" },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return {
      productiveHours: result.productiveHours || [],
      preferredCategories: result.preferredCategories || [],
      completionRate: result.completionRate || completionRate,
      averageTaskDuration: result.averageTaskDuration || "30 minutes",
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("Error analyzing productivity patterns:", error);
    return {
      productiveHours: [],
      preferredCategories: [],
      completionRate: 0,
      averageTaskDuration: "30 minutes",
      recommendations: []
    };
  }
}