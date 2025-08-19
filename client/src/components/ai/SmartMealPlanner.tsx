import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ChefHat, Calendar, DollarSign, Clock, Users, 
  Sparkles, ShoppingCart, TrendingUp, Lightbulb,
  AlertTriangle, CheckCircle, Zap
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  pantryUtilization: number;
  weatherAppropriate: boolean;
  eventSynergy?: string;
}

interface BudgetAnalysis {
  estimatedWeeklyCost: number;
  budgetUtilization: number;
  savingsOpportunities: string[];
  budgetWarnings: string[];
}

interface SmartInsights {
  mealPrepTips: string[];
  shoppingOptimizations: string[];
  calendarIntegrations: string[];
}

export function SmartMealPlanner() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: mealPlan, isLoading, refetch } = useQuery({
    queryKey: ['/api/ai/meal-plan'],
    enabled: false, // Only fetch when user requests
  });

  const generateMealPlan = useMutation({
    mutationFn: () => apiRequest('POST', '/api/ai/meal-plan', {}),
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/ai/meal-plan'], data);
      toast({
        title: "AI Meal Plan Generated!",
        description: `Created ${data.weeklyPlan?.length || 0} meal recommendations with budget analysis.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Could not generate meal plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      await generateMealPlan.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getBudgetImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const weeklyPlan: MealRecommendation[] = mealPlan?.weeklyPlan || [];
  const budgetAnalysis: BudgetAnalysis = mealPlan?.budgetAnalysis || {};
  const smartInsights: SmartInsights = mealPlan?.smartInsights || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <span>AI-Powered Smart Meal Planner</span>
          </CardTitle>
          <CardDescription>
            Intelligent meal planning that considers your calendar, budget, and family preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Generate Button */}
            <Button 
              onClick={handleGeneratePlan}
              disabled={isGenerating || generateMealPlan.isPending}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating Smart Meal Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Meal Plan
                </>
              )}
            </Button>

            {/* Budget Analysis */}
            {budgetAnalysis.estimatedWeeklyCost > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ${budgetAnalysis.estimatedWeeklyCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-700">Weekly Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {budgetAnalysis.budgetUtilization.toFixed(0)}%
                  </div>
                  <div className="text-xs text-green-700">Budget Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {budgetAnalysis.savingsOpportunities?.length || 0}
                  </div>
                  <div className="text-xs text-purple-700">Savings Tips</div>
                </div>
              </div>
            )}

            {/* Budget Warnings */}
            {budgetAnalysis.budgetWarnings?.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {budgetAnalysis.budgetWarnings.slice(0, 2).map((warning, idx) => (
                      <div key={idx} className="text-sm">⚠️ {warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Meal Plan */}
      {weeklyPlan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week's AI Meal Plan</CardTitle>
            <CardDescription>
              Personalized recommendations based on your schedule and budget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyPlan.map((meal, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-lg">{meal.title}</h4>
                      <p className="text-sm text-muted-foreground">{meal.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${meal.estimatedCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">per serving</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <Badge variant="outline" className="capitalize">{meal.mealType}</Badge>
                    <Badge variant="secondary">{meal.suggestedDate}</Badge>
                    <div className={`px-2 py-1 rounded border text-xs ${getDifficultyColor(meal.difficulty)}`}>
                      {meal.difficulty}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {meal.prepTime}
                    </div>
                    <div className={`flex items-center ${getBudgetImpactColor(meal.budgetImpact)}`}>
                      <DollarSign className="h-3 w-3 mr-1" />
                      {meal.budgetImpact} cost
                    </div>
                  </div>

                  {/* Pantry Utilization */}
                  {meal.pantryUtilization > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Pantry Usage:</span>
                      <Progress value={meal.pantryUtilization} className="flex-1 h-2" />
                      <span className="text-xs text-gray-600">{meal.pantryUtilization}%</span>
                    </div>
                  )}

                  {/* Context and Benefits */}
                  <div className="space-y-2">
                    <p className="text-xs text-blue-600 italic">
                      🧠 {meal.contextualReason}
                    </p>
                    
                    {meal.eventSynergy && (
                      <p className="text-xs text-purple-600 font-medium">
                        📅 {meal.eventSynergy}
                      </p>
                    )}

                    {meal.nutritionalBenefits.length > 0 && (
                      <div className="text-xs text-green-600">
                        <span className="font-medium">Health benefits:</span> {meal.nutritionalBenefits.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Ingredients Preview */}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Key ingredients:</span> {meal.ingredients.slice(0, 5).join(', ')}
                    {meal.ingredients.length > 5 && ` (+${meal.ingredients.length - 5} more)`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Insights */}
      {(smartInsights.mealPrepTips?.length > 0 || smartInsights.shoppingOptimizations?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Meal Prep Tips */}
          {smartInsights.mealPrepTips?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>Meal Prep Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {smartInsights.mealPrepTips.slice(0, 4).map((tip, idx) => (
                    <li key={idx} className="text-sm flex items-start">
                      <CheckCircle className="h-3 w-3 mr-2 mt-1 text-green-500 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Shopping Optimizations */}
          {smartInsights.shoppingOptimizations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                  <span>Shopping Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {smartInsights.shoppingOptimizations.slice(0, 4).map((tip, idx) => (
                    <li key={idx} className="text-sm flex items-start">
                      <TrendingUp className="h-3 w-3 mr-2 mt-1 text-blue-500 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Savings Opportunities */}
      {budgetAnalysis.savingsOpportunities?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-500" />
              <span>Money-Saving Opportunities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {budgetAnalysis.savingsOpportunities.map((opportunity, idx) => (
                <div key={idx} className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                  <p className="text-sm text-green-700">{opportunity}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}