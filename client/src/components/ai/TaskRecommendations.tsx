import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Plus, RefreshCw, TrendingUp, Zap, Brain, Users, Target } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PersonalizedInsights } from "./PersonalizedInsights";

interface TaskRecommendation {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: string;
  reasoning: string;
  bestTimeToComplete: string;
  personalizedScore: number;
  motivationTrigger?: string;
  suggestedSubtasks?: string[];
  collaborationOpportunity?: boolean;
  energyLevelRequired: 'low' | 'medium' | 'high';
  focusLevelRequired: 'low' | 'medium' | 'high';
}

interface ProductivityInsights {
  productiveHours: string[];
  preferredCategories: string[];
  completionRate: number;
  averageTaskDuration: string;
  recommendations: string[];
}

export function TaskRecommendations() {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: recommendationsData, isLoading: isLoadingRecs, refetch: refetchRecommendations } = useQuery({
    queryKey: ['/api/ai/task-recommendations'],
    refetchOnWindowFocus: false,
  });

  const { data: insights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['/api/ai/productivity-insights'],
    refetchOnWindowFocus: false,
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiRequest('/api/tasks', 'POST', taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task Added",
        description: "AI-recommended task has been added to your list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const recommendations: TaskRecommendation[] = recommendationsData?.recommendations || [];
  const behaviorProfile = recommendationsData?.behaviorProfile || null;
  const productivityInsights: ProductivityInsights = insights || {
    productiveHours: [],
    preferredCategories: [],
    completionRate: 0,
    averageTaskDuration: "30 minutes",
    recommendations: []
  };

  const handleAddTask = (recommendation: TaskRecommendation) => {
    createTaskMutation.mutate({
      title: recommendation.title,
      description: recommendation.description,
      priority: recommendation.priority,
      category: recommendation.category,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEnergyIcon = (level: string) => {
    switch (level) {
      case 'high': return <Zap className="h-3 w-3 text-yellow-500" />;
      case 'medium': return <Zap className="h-3 w-3 text-orange-500" />;
      case 'low': return <Zap className="h-3 w-3 text-gray-400" />;
      default: return <Zap className="h-3 w-3 text-gray-400" />;
    }
  };

  const getFocusIcon = (level: string) => {
    switch (level) {
      case 'high': return <Brain className="h-3 w-3 text-blue-500" />;
      case 'medium': return <Brain className="h-3 w-3 text-blue-400" />;
      case 'low': return <Brain className="h-3 w-3 text-gray-400" />;
      default: return <Brain className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Task Recommendations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Task Recommendations</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchRecommendations()}
              disabled={isLoadingRecs}
              data-testid="button-refresh-recommendations"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingRecs ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="button-toggle-insights"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Insights
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingRecs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3" data-testid={`recommendation-${index}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddTask(rec)}
                      disabled={createTaskMutation.isPending}
                      data-testid={`button-add-task-${index}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <Badge variant={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                    <Badge variant="outline">{rec.category}</Badge>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {rec.estimatedDuration}
                    </div>
                    <div className="flex items-center space-x-1">
                      {getEnergyIcon(rec.energyLevelRequired)}
                      {getFocusIcon(rec.focusLevelRequired)}
                    </div>
                    {rec.collaborationOpportunity && (
                      <div className="flex items-center text-purple-600">
                        <Users className="h-3 w-3 mr-1" />
                        <span>Team</span>
                      </div>
                    )}
                    <div className="flex items-center text-blue-600">
                      <Target className="h-3 w-3 mr-1" />
                      <span>{rec.personalizedScore}/100</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground italic">
                      💡 {rec.reasoning}
                    </p>
                    {rec.motivationTrigger && (
                      <p className="text-xs text-blue-600 font-medium">
                        🎯 {rec.motivationTrigger}
                      </p>
                    )}
                    {rec.suggestedSubtasks && rec.suggestedSubtasks.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Quick steps:</span>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                          {rec.suggestedSubtasks.slice(0, 3).map((subtask, idx) => (
                            <li key={idx}>{subtask}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recommendations available right now.</p>
              <p className="text-xs">Complete more tasks to improve AI suggestions.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Personalized Insights */}
      {isExpanded && behaviorProfile && (
        <PersonalizedInsights 
          behaviorProfile={behaviorProfile}
          isLoading={isLoadingInsights}
        />
      )}

      {/* Legacy Productivity Insights */}
      {isExpanded && !behaviorProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Productivity Insights</span>
            </CardTitle>
            <CardDescription>
              AI analysis of your task completion patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getCompletionRateColor(productivityInsights.completionRate)}`}>
                      {productivityInsights.completionRate.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {productivityInsights.averageTaskDuration}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {productivityInsights.preferredCategories.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {productivityInsights.productiveHours.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Peak Hours</div>
                  </div>
                </div>

                {/* Preferred Categories */}
                {productivityInsights.preferredCategories.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Most Active Categories</h5>
                    <div className="flex flex-wrap gap-1">
                      {productivityInsights.preferredCategories.map((category, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Productive Hours */}
                {productivityInsights.productiveHours.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Most Productive Times</h5>
                    <div className="flex flex-wrap gap-1">
                      {productivityInsights.productiveHours.map((hour, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {hour}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Recommendations */}
                {productivityInsights.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">AI Insights</h5>
                    <ul className="space-y-1">
                      {productivityInsights.recommendations.map((insight, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="mr-2">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}