import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  assignedTo?: string;
}

interface UserBehaviorProfile {
  userId: string;
  productivityPatterns: {
    peakHours: string[];
    preferredTaskDuration: string;
    energyLevels: Record<string, 'low' | 'medium' | 'high'>;
    focusPatterns: Record<string, 'low' | 'medium' | 'high'>;
  };
  taskPreferences: {
    favoriteCategories: string[];
    avoidedCategories: string[];
    preferredPriorities: string[];
    completionStyle: 'batch' | 'steady' | 'burst';
  };
  motivationalFactors: {
    streakMotivated: boolean;
    collaborationDriven: boolean;
    achievementOriented: boolean;
    deadlineDriven: boolean;
  };
  behaviorInsights: {
    procrastinationTriggers: string[];
    productivityBoosts: string[];
    optimalTaskSequencing: string[];
    burnoutIndicators: string[];
  };
}

export async function analyzeBehaviorPatterns(
  userId: string,
  tasks: Task[],
  timeframe: 'week' | 'month' | 'quarter' = 'month'
): Promise<UserBehaviorProfile> {
  try {
    const completedTasks = tasks.filter(t => t.completed && t.completedAt);
    const pendingTasks = tasks.filter(t => !t.completed);
    
    // Calculate completion patterns by time
    const completionsByHour = completedTasks.reduce((acc, task) => {
      if (task.completedAt) {
        const hour = task.completedAt.getHours();
        const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate completion patterns by day
    const completionsByDay = completedTasks.reduce((acc, task) => {
      if (task.completedAt) {
        const day = task.completedAt.toLocaleDateString('en-US', { weekday: 'long' });
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Category preferences
    const categoryStats = tasks.reduce((acc, task) => {
      const cat = task.category || 'Other';
      if (!acc[cat]) acc[cat] = { total: 0, completed: 0 };
      acc[cat].total++;
      if (task.completed) acc[cat].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    const prompt = `Analyze this user's task completion behavior and create a comprehensive behavioral profile.

USER DATA:
- User ID: ${userId}
- Total tasks: ${tasks.length}
- Completed tasks: ${completedTasks.length}
- Completion rate: ${tasks.length > 0 ? (completedTasks.length / tasks.length * 100).toFixed(1) : 0}%
- Pending tasks: ${pendingTasks.length}

TIME PATTERNS:
- Completions by time: ${JSON.stringify(completionsByHour)}
- Completions by day: ${JSON.stringify(completionsByDay)}

CATEGORY PERFORMANCE:
${Object.entries(categoryStats).map(([cat, stats]) => 
  `- ${cat}: ${stats.completed}/${stats.total} (${(stats.completed/stats.total*100).toFixed(1)}%)`
).join('\n')}

RECENT TASK DETAILS:
${completedTasks.slice(0, 20).map(t => 
  `"${t.title}" (${t.category}, ${t.priority}) - completed ${t.completedAt?.toISOString()}`
).join('\n')}

PENDING TASKS:
${pendingTasks.slice(0, 10).map(t => 
  `"${t.title}" (${t.category}, ${t.priority}) - created ${t.createdAt.toISOString()}`
).join('\n')}

Analyze patterns and provide insights about:
1. Peak productivity hours and energy levels throughout the day
2. Preferred task categories and avoidance patterns
3. Motivational factors (streaks, collaboration, achievements)
4. Procrastination triggers and productivity boosters
5. Optimal task sequencing and completion style
6. Signs of burnout or overwhelm

Respond with detailed JSON analysis:`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            productivityPatterns: {
              type: "object",
              properties: {
                peakHours: { type: "array", items: { type: "string" } },
                preferredTaskDuration: { type: "string" },
                energyLevels: {
                  type: "object",
                  properties: {
                    morning: { type: "string" },
                    afternoon: { type: "string" },
                    evening: { type: "string" }
                  }
                },
                focusPatterns: {
                  type: "object", 
                  properties: {
                    bestTimes: { type: "array", items: { type: "string" } },
                    distractions: { type: "array", items: { type: "string" } },
                    focusDuration: { type: "string" }
                  }
                }
              }
            },
            taskPreferences: {
              type: "object",
              properties: {
                favoriteCategories: { type: "array", items: { type: "string" } },
                avoidedCategories: { type: "array", items: { type: "string" } },
                preferredPriorities: { type: "array", items: { type: "string" } },
                completionStyle: { type: "string" }
              }
            },
            motivationalFactors: {
              type: "object",
              properties: {
                streakMotivated: { type: "boolean" },
                collaborationDriven: { type: "boolean" },
                achievementOriented: { type: "boolean" },
                deadlineDriven: { type: "boolean" }
              }
            },
            behaviorInsights: {
              type: "object",
              properties: {
                procrastinationTriggers: { type: "array", items: { type: "string" } },
                productivityBoosts: { type: "array", items: { type: "string" } },
                optimalTaskSequencing: { type: "array", items: { type: "string" } },
                burnoutIndicators: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return {
      userId,
      productivityPatterns: result.productivityPatterns || {
        peakHours: ['morning'],
        preferredTaskDuration: '30 minutes',
        energyLevels: { morning: 'high', afternoon: 'medium', evening: 'low' },
        focusPatterns: { morning: 'high', afternoon: 'medium', evening: 'low' }
      },
      taskPreferences: result.taskPreferences || {
        favoriteCategories: ['Personal'],
        avoidedCategories: [],
        preferredPriorities: ['medium'],
        completionStyle: 'steady'
      },
      motivationalFactors: result.motivationalFactors || {
        streakMotivated: false,
        collaborationDriven: false,
        achievementOriented: true,
        deadlineDriven: false
      },
      behaviorInsights: result.behaviorInsights || {
        procrastinationTriggers: [],
        productivityBoosts: [],
        optimalTaskSequencing: [],
        burnoutIndicators: []
      }
    };
  } catch (error) {
    console.error("Error analyzing behavior patterns:", error);
    // Return default profile
    return {
      userId,
      productivityPatterns: {
        peakHours: ['morning'],
        preferredTaskDuration: '30 minutes',
        energyLevels: { morning: 'high', afternoon: 'medium', evening: 'low' },
        focusPatterns: { morning: 'high', afternoon: 'medium', evening: 'low' }
      },
      taskPreferences: {
        favoriteCategories: ['Personal'],
        avoidedCategories: [],
        preferredPriorities: ['medium'],
        completionStyle: 'steady'
      },
      motivationalFactors: {
        streakMotivated: false,
        collaborationDriven: false,
        achievementOriented: true,
        deadlineDriven: false
      },
      behaviorInsights: {
        procrastinationTriggers: [],
        productivityBoosts: [],
        optimalTaskSequencing: [],
        burnoutIndicators: []
      }
    };
  }
}

export async function generateContextualInsights(
  userProfile: UserBehaviorProfile,
  currentContext: {
    timeOfDay: string;
    dayOfWeek: string;
    recentCompletions: number;
    pendingTaskCount: number;
    weather?: string;
  }
): Promise<{
  currentEnergyLevel: 'low' | 'medium' | 'high';
  currentFocusLevel: 'low' | 'medium' | 'high';
  recommendedTaskTypes: string[];
  motivationalMessage: string;
  productivityTips: string[];
}> {
  try {
    const prompt = `Generate contextual insights for this user's current situation.

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

CURRENT CONTEXT:
- Time: ${currentContext.timeOfDay} on ${currentContext.dayOfWeek}
- Recent completions: ${currentContext.recentCompletions}
- Pending tasks: ${currentContext.pendingTaskCount}
- Weather: ${currentContext.weather || 'Unknown'}

Based on the user's behavioral patterns and current context, provide:
1. Estimated current energy and focus levels
2. Most suitable task types for right now
3. Personalized motivational message
4. 3-5 specific productivity tips for this moment

Consider the user's peak hours, completion patterns, and motivational factors.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            currentEnergyLevel: { type: "string" },
            currentFocusLevel: { type: "string" },
            recommendedTaskTypes: { type: "array", items: { type: "string" } },
            motivationalMessage: { type: "string" },
            productivityTips: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return {
      currentEnergyLevel: result.currentEnergyLevel || 'medium',
      currentFocusLevel: result.currentFocusLevel || 'medium',
      recommendedTaskTypes: result.recommendedTaskTypes || ['Personal'],
      motivationalMessage: result.motivationalMessage || 'You have got this! Focus on one task at a time.',
      productivityTips: result.productivityTips || ['Take regular breaks', 'Start with easy tasks', 'Set a timer']
    };
  } catch (error) {
    console.error("Error generating contextual insights:", error);
    return {
      currentEnergyLevel: 'medium',
      currentFocusLevel: 'medium',
      recommendedTaskTypes: ['Personal'],
      motivationalMessage: 'You have got this! Focus on one task at a time.',
      productivityTips: ['Take regular breaks', 'Start with easy tasks', 'Set a timer']
    };
  }
}