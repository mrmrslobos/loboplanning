import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface MealPlanningInput {
  userId: string;
  familyId?: string;
  budget?: {
    monthlyGroceryBudget: number;
    currentSpending: number;
    upcomingBills: Array<{
      name: string;
      amount: number;
      dueDate: Date;
    }>;
  };
  calendar?: {
    upcomingEvents: Array<{
      title: string;
      date: Date;
      type: string;
    }>;
    busyDays: string[];
  };
  preferences?: {
    dietaryRestrictions: string[];
    favoriteCuisines: string[];
    cookingSkillLevel: 'beginner' | 'intermediate' | 'advanced';
    prepTimePreference: string;
    familySize: number;
  };
  currentMeals?: Array<{
    title: string;
    date: Date;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }>;
  pantryItems?: string[];
  weatherForecast?: string;
}

interface MealRecommendation {
  title: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  suggestedDate: string;
  estimatedCost: number;
  prepTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: string[];
  nutritionalBenefits: string[];
  contextualReason: string;
  budgetImpact: 'low' | 'medium' | 'high';
  pantryUtilization: number; // 0-100% how much uses existing pantry items
  weatherAppropriate: boolean;
  eventSynergy?: string; // How it relates to calendar events
}

export async function generateMealPlan(input: MealPlanningInput): Promise<{
  weeklyPlan: MealRecommendation[];
  budgetAnalysis: {
    estimatedWeeklyCost: number;
    budgetUtilization: number;
    savingsOpportunities: string[];
    budgetWarnings: string[];
  };
  smartInsights: {
    mealPrepTips: string[];
    shoppingOptimizations: string[];
    calendarIntegrations: string[];
  };
}> {
  try {
    const budgetConstraints = input.budget ? {
      available: input.budget.monthlyGroceryBudget - input.budget.currentSpending,
      upcomingBillImpact: input.budget.upcomingBills.reduce((sum, bill) => sum + bill.amount, 0)
    } : null;

    const busyDays = input.calendar?.busyDays || [];
    const upcomingEvents = input.calendar?.upcomingEvents || [];

    const prompt = `You are an AI meal planning expert that considers budget, calendar, and family context. Generate a comprehensive 7-day meal plan with smart recommendations.

FAMILY CONTEXT:
- Family size: ${input.preferences?.familySize || 2}
- Cooking skill: ${input.preferences?.cookingSkillLevel || 'intermediate'}
- Prep time preference: ${input.preferences?.prepTimePreference || '30-45 minutes'}
- Dietary restrictions: ${input.preferences?.dietaryRestrictions?.join(', ') || 'None'}
- Favorite cuisines: ${input.preferences?.favoriteCuisines?.join(', ') || 'Varied'}

BUDGET CONSTRAINTS:
${budgetConstraints ? `
- Available grocery budget: $${budgetConstraints.available}
- Upcoming bills total: $${budgetConstraints.upcomingBillImpact}
- Current spending: $${input.budget?.currentSpending || 0}
` : 'No budget constraints provided'}

CALENDAR INTEGRATION:
- Busy days this week: ${busyDays.join(', ') || 'None specified'}
- Upcoming events: ${upcomingEvents.map(e => `${e.title} on ${e.date.toDateString()}`).join(', ') || 'None'}

PANTRY ITEMS:
${input.pantryItems?.join(', ') || 'No pantry inventory provided'}

WEATHER CONTEXT:
${input.weatherForecast || 'No weather information available'}

CURRENT MEALS PLANNED:
${input.currentMeals?.map(m => `${m.title} (${m.mealType}) on ${m.date.toDateString()}`).join(', ') || 'No existing meals'}

SMART MEAL PLANNING RULES:
1. Suggest quick/easy meals for busy days
2. Plan special/elaborate meals around events
3. Maximize pantry item usage to reduce costs
4. Consider weather (hot weather = lighter meals, cold = hearty)
5. Balance nutrition across the week
6. Optimize shopping efficiency (similar ingredients)
7. Suggest meal prep opportunities
8. Factor in leftover utilization
9. Align portion sizes with family size
10. Stay within budget constraints

Generate a complete meal plan with budget analysis and smart insights.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            weeklyPlan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  mealType: { type: "string" },
                  suggestedDate: { type: "string" },
                  estimatedCost: { type: "number" },
                  prepTime: { type: "string" },
                  difficulty: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  nutritionalBenefits: { type: "array", items: { type: "string" } },
                  contextualReason: { type: "string" },
                  budgetImpact: { type: "string" },
                  pantryUtilization: { type: "number" },
                  weatherAppropriate: { type: "boolean" },
                  eventSynergy: { type: "string" }
                }
              }
            },
            budgetAnalysis: {
              type: "object",
              properties: {
                estimatedWeeklyCost: { type: "number" },
                budgetUtilization: { type: "number" },
                savingsOpportunities: { type: "array", items: { type: "string" } },
                budgetWarnings: { type: "array", items: { type: "string" } }
              }
            },
            smartInsights: {
              type: "object",
              properties: {
                mealPrepTips: { type: "array", items: { type: "string" } },
                shoppingOptimizations: { type: "array", items: { type: "string" } },
                calendarIntegrations: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      weeklyPlan: result.weeklyPlan || [],
      budgetAnalysis: result.budgetAnalysis || {
        estimatedWeeklyCost: 0,
        budgetUtilization: 0,
        savingsOpportunities: [],
        budgetWarnings: []
      },
      smartInsights: result.smartInsights || {
        mealPrepTips: [],
        shoppingOptimizations: [],
        calendarIntegrations: []
      }
    };
  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw new Error("Failed to generate AI meal plan");
  }
}

export async function generateGroceryList(meals: MealRecommendation[], budget: number): Promise<{
  groceryList: Array<{
    item: string;
    category: string;
    estimatedCost: number;
    priority: 'essential' | 'preferred' | 'optional';
    stores: string[];
    substitutes: string[];
  }>;
  shoppingSummary: {
    totalEstimatedCost: number;
    budgetStatus: 'under' | 'at' | 'over';
    savingsTips: string[];
  };
}> {
  try {
    const allIngredients = meals.flatMap(meal => meal.ingredients);
    const totalMealCost = meals.reduce((sum, meal) => sum + meal.estimatedCost, 0);

    const prompt = `Generate an optimized grocery list from these meal ingredients, considering budget constraints.

MEALS AND INGREDIENTS:
${meals.map(meal => `${meal.title}: ${meal.ingredients.join(', ')}`).join('\n')}

BUDGET: $${budget}
ESTIMATED MEAL COSTS: $${totalMealCost}

Create a smart grocery list with categories, priorities, cost estimates, and shopping optimizations.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            groceryList: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  category: { type: "string" },
                  estimatedCost: { type: "number" },
                  priority: { type: "string" },
                  stores: { type: "array", items: { type: "string" } },
                  substitutes: { type: "array", items: { type: "string" } }
                }
              }
            },
            shoppingSummary: {
              type: "object",
              properties: {
                totalEstimatedCost: { type: "number" },
                budgetStatus: { type: "string" },
                savingsTips: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating grocery list:", error);
    throw new Error("Failed to generate grocery list");
  }
}