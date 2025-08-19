import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface TaskRecommendationInput {
  userId: string;
  familyId?: string;
  recentTasks: Array<{
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    completed: boolean;
    completedAt?: Date;
    createdAt: Date;
    assignedTo?: string;
  }>;
  familyTasks?: Array<{
    title: string;
    category?: string;
    priority?: string;
    completed: boolean;
    assignedTo?: string;
    createdAt: Date;
  }>;
  upcomingEvents?: Array<{
    title: string;
    date: Date;
    description?: string;
  }>;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: string;
  currentWeather?: string;
  userPreferences?: {
    workingHours?: string;
    categories?: string[];
    productivityStyle?: string;
    energyLevels?: Record<string, string>; // time -> energy level
    focusDuration?: string;
  };
  personalContext?: {
    recentCompletionStreak?: number;
    averageTasksPerDay?: number;
    preferredTaskTypes?: string[];
    avoidancePatterns?: string[];
    motivationalFactors?: string[];
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
  personalizedScore: number; // 0-100, how well this matches the user
  motivationTrigger?: string;
  suggestedSubtasks?: string[];
  collaborationOpportunity?: boolean;
  energyLevelRequired: 'low' | 'medium' | 'high';
  focusLevelRequired: 'low' | 'medium' | 'high';
}

export async function generateTaskRecommendations(
  input: TaskRecommendationInput
): Promise<TaskRecommendation[]> {
  try {
    const recentCompletedTasks = input.recentTasks
      .filter(task => task.completed)
      .slice(0, 15)
      .map(task => `"${task.title}" (${task.category}, ${task.priority}) - completed ${task.completedAt?.toLocaleDateString()}`);

    const recentPendingTasks = input.recentTasks
      .filter(task => !task.completed)
      .slice(0, 10)
      .map(task => `"${task.title}" (${task.category}, ${task.priority}) - assigned to ${task.assignedTo}`);

    const familyTaskPatterns = input.familyTasks
      ?.slice(0, 20)
      .reduce((acc, task) => {
        const key = `${task.category}-${task.assignedTo}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const upcomingEventsText = input.upcomingEvents
      ?.slice(0, 5)
      .map(event => `"${event.title}" on ${event.date.toLocaleDateString()}`)
      .join(", ") || "None";

    const personalContext = input.personalContext || {};
    const completionStreak = personalContext.recentCompletionStreak || 0;
    const avgTasksPerDay = personalContext.averageTasksPerDay || 3;

    const prompt = `You are an advanced AI task management assistant with deep personalization capabilities. Generate 4-6 highly personalized task recommendations based on comprehensive user analysis.

CURRENT CONTEXT:
- Time: ${input.timeOfDay} on ${input.dayOfWeek}
- Weather: ${input.currentWeather || "Unknown"}
- Recent completed tasks: ${recentCompletedTasks.join(", ") || "None"}
- Current pending tasks: ${recentPendingTasks.join(", ") || "None"}
- Upcoming events: ${upcomingEventsText}

USER PROFILE:
- Completion streak: ${completionStreak} days
- Average tasks per day: ${avgTasksPerDay}
- Working hours: ${input.userPreferences?.workingHours || "Flexible"}
- Preferred categories: ${input.userPreferences?.categories?.join(", ") || "Mixed"}
- Productivity style: ${input.userPreferences?.productivityStyle || "Adaptive"}
- Focus duration: ${input.userPreferences?.focusDuration || "30-60 minutes"}
- Energy levels: ${JSON.stringify(input.userPreferences?.energyLevels || {})}

FAMILY DYNAMICS:
- Family task patterns: ${JSON.stringify(familyTaskPatterns)}
- Family collaboration opportunities: ${input.familyId ? "Available" : "N/A"}

PERSONALIZATION INSIGHTS:
- Preferred task types: ${personalContext.preferredTaskTypes?.join(", ") || "Learning from behavior"}
- Avoidance patterns: ${personalContext.avoidancePatterns?.join(", ") || "None identified"}
- Motivation triggers: ${personalContext.motivationalFactors?.join(", ") || "Achievement, progress"}

ADVANCED PERSONALIZATION RULES:
1. Analyze completion patterns to predict optimal task timing
2. Consider user's energy and focus levels for current time
3. Factor in family collaboration opportunities 
4. Adapt difficulty based on recent completion streak
5. Suggest tasks that build on recent successes
6. Include variety while respecting preferences
7. Consider weather and environmental factors
8. Balance individual and family-oriented tasks
9. Provide motivational context for each suggestion
10. Include energy/focus requirements for each task

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "title": "Clear and specific task title",
      "description": "Detailed description with actionable steps",
      "category": "Work|Personal|Health|Learning|Household|Family|Creative",
      "priority": "low|medium|high",
      "estimatedDuration": "5 minutes|15 minutes|30 minutes|1 hour|2 hours|3+ hours",
      "reasoning": "Personalized explanation based on user patterns and context",
      "bestTimeToComplete": "Now|In 1 hour|Later today|Tomorrow morning|This week|Weekend",
      "personalizedScore": 85,
      "motivationTrigger": "How this connects to user's goals or patterns",
      "suggestedSubtasks": ["Step 1", "Step 2", "Step 3"],
      "collaborationOpportunity": true,
      "energyLevelRequired": "low|medium|high",
      "focusLevelRequired": "low|medium|high"
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
                  bestTimeToComplete: { type: "string" },
                  personalizedScore: { type: "number" },
                  motivationTrigger: { type: "string" },
                  suggestedSubtasks: { 
                    type: "array",
                    items: { type: "string" }
                  },
                  collaborationOpportunity: { type: "boolean" },
                  energyLevelRequired: { type: "string" },
                  focusLevelRequired: { type: "string" }
                },
                required: ["title", "description", "category", "priority", "estimatedDuration", "reasoning", "bestTimeToComplete", "personalizedScore", "energyLevelRequired", "focusLevelRequired"]
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