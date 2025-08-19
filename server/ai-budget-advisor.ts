import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface BudgetAnalysisInput {
  userId: string;
  familyId?: string;
  currentBudget: {
    totalIncome: number;
    categories: Array<{
      name: string;
      budgeted: number;
      spent: number;
      remaining: number;
    }>;
  };
  upcomingBills: Array<{
    name: string;
    amount: number;
    dueDate: Date;
    category: string;
    recurring: boolean;
  }>;
  calendarEvents?: Array<{
    title: string;
    date: Date;
    type: string;
    estimatedCost?: number;
  }>;
  spendingHistory?: Array<{
    amount: number;
    category: string;
    date: Date;
    description: string;
  }>;
  goals?: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
  }>;
}

interface BudgetRecommendation {
  type: 'warning' | 'opportunity' | 'insight' | 'action';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'this_week' | 'this_month' | 'long_term';
  suggestedActions: string[];
  potentialSavings?: number;
  calendarContext?: string;
}

export async function analyzeBudgetWithCalendar(input: BudgetAnalysisInput): Promise<{
  recommendations: BudgetRecommendation[];
  cashFlowAnalysis: {
    nextWeekOutflow: number;
    nextMonthOutflow: number;
    riskLevel: 'low' | 'medium' | 'high';
    bufferDays: number;
  };
  calendarBudgetTips: Array<{
    eventDate: Date;
    eventTitle: string;
    budgetImpact: string;
    suggestions: string[];
  }>;
  spendingInsights: {
    trends: string[];
    patterns: string[];
    optimizations: string[];
  };
}> {
  try {
    const totalSpent = input.currentBudget.categories.reduce((sum, cat) => sum + cat.spent, 0);
    const totalBudgeted = input.currentBudget.categories.reduce((sum, cat) => sum + cat.budgeted, 0);
    const upcomingBillTotal = input.upcomingBills.reduce((sum, bill) => sum + bill.amount, 0);
    
    const nextWeekBills = input.upcomingBills.filter(bill => {
      const daysDiff = Math.ceil((bill.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });

    const calendarCosts = input.calendarEvents?.filter(event => event.estimatedCost).reduce((sum, event) => sum + (event.estimatedCost || 0), 0) || 0;

    const prompt = `You are an AI financial advisor analyzing a family's budget with calendar integration. Provide comprehensive budget analysis and recommendations.

CURRENT BUDGET STATUS:
- Total Income: $${input.currentBudget.totalIncome}
- Total Budgeted: $${totalBudgeted}
- Total Spent: $${totalSpent}
- Remaining Budget: $${totalBudgeted - totalSpent}

BUDGET CATEGORIES:
${input.currentBudget.categories.map(cat => 
  `- ${cat.name}: $${cat.spent}/$${cat.budgeted} (${cat.remaining < 0 ? 'OVER' : 'remaining: $' + cat.remaining})`
).join('\n')}

UPCOMING BILLS (Next 30 days):
${input.upcomingBills.map(bill => 
  `- ${bill.name}: $${bill.amount} due ${bill.dueDate.toDateString()} (${bill.category})`
).join('\n')}

NEXT WEEK BILLS: $${nextWeekBills.reduce((sum, bill) => sum + bill.amount, 0)}

CALENDAR EVENTS WITH COSTS:
${input.calendarEvents?.filter(e => e.estimatedCost).map(event => 
  `- ${event.title}: $${event.estimatedCost} on ${event.date.toDateString()}`
).join('\n') || 'No events with estimated costs'}

SPENDING HISTORY (Last 30 days):
${input.spendingHistory?.slice(0, 20).map(expense => 
  `- $${expense.amount} in ${expense.category}: ${expense.description} (${expense.date.toDateString()})`
).join('\n') || 'No spending history provided'}

FINANCIAL GOALS:
${input.goals?.map(goal => 
  `- ${goal.name}: $${goal.currentAmount}/$${goal.targetAmount} by ${goal.targetDate.toDateString()}`
).join('\n') || 'No goals set'}

ANALYSIS REQUIREMENTS:
1. Identify budget categories at risk of overspending
2. Warn about upcoming bill conflicts with available funds
3. Suggest optimizations based on spending patterns
4. Correlate calendar events with budget impact
5. Recommend timing for large purchases
6. Identify saving opportunities
7. Assess goal progress and suggest adjustments
8. Provide cash flow warnings
9. Suggest budget reallocations
10. Recommend emergency fund strategies

Generate comprehensive budget recommendations with calendar integration.`;

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
                  type: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  timeframe: { type: "string" },
                  suggestedActions: { type: "array", items: { type: "string" } },
                  potentialSavings: { type: "number", minimum: 0 },
                  calendarContext: { type: "string" }
                }
              }
            },
            cashFlowAnalysis: {
              type: "object",
              properties: {
                nextWeekOutflow: { type: "number", minimum: 0 },
                nextMonthOutflow: { type: "number", minimum: 0 },
                riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                bufferDays: { type: "number", minimum: 0 }
              }
            },
            calendarBudgetTips: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  eventDate: { type: "string" },
                  eventTitle: { type: "string" },
                  budgetImpact: { type: "string" },
                  suggestions: { type: "array", items: { type: "string" } }
                }
              }
            },
            spendingInsights: {
              type: "object",
              properties: {
                trends: { type: "array", items: { type: "string" } },
                patterns: { type: "array", items: { type: "string" } },
                optimizations: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      recommendations: result.recommendations || [],
      cashFlowAnalysis: result.cashFlowAnalysis || {
        nextWeekOutflow: nextWeekBills.reduce((sum, bill) => sum + bill.amount, 0),
        nextMonthOutflow: upcomingBillTotal,
        riskLevel: 'medium',
        bufferDays: 0
      },
      calendarBudgetTips: result.calendarBudgetTips?.map((tip: any) => ({
        ...tip,
        eventDate: new Date(tip.eventDate)
      })) || [],
      spendingInsights: result.spendingInsights || {
        trends: [],
        patterns: [],
        optimizations: []
      }
    };
  } catch (error) {
    console.error("Error analyzing budget:", error);
    throw new Error("Failed to analyze budget with calendar");
  }
}

export async function generateBudgetAlerts(input: BudgetAnalysisInput): Promise<Array<{
  type: 'bill_due' | 'overspending' | 'goal_progress' | 'calendar_cost';
  urgency: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionRequired: boolean;
  suggestedAction?: string;
}>> {
  try {
    const alerts = [];

    // Check for bills due in next 3 days
    const criticalBills = input.upcomingBills.filter(bill => {
      const daysDiff = Math.ceil((bill.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 3 && daysDiff >= 0;
    });

    for (const bill of criticalBills) {
      alerts.push({
        type: 'bill_due' as const,
        urgency: 'high' as const,
        title: `Bill Due Soon: ${bill.name}`,
        message: `$${bill.amount} due ${bill.dueDate.toDateString()}`,
        actionRequired: true,
        suggestedAction: 'Schedule payment or ensure sufficient funds'
      });
    }

    // Check for overspending
    const overspentCategories = input.currentBudget.categories.filter(cat => cat.remaining < 0);
    for (const category of overspentCategories) {
      alerts.push({
        type: 'overspending' as const,
        urgency: 'medium' as const,
        title: `Budget Exceeded: ${category.name}`,
        message: `Over budget by $${Math.abs(category.remaining)}`,
        actionRequired: true,
        suggestedAction: 'Review spending or adjust budget allocation'
      });
    }

    return alerts;
  } catch (error) {
    console.error("Error generating budget alerts:", error);
    return [];
  }
}