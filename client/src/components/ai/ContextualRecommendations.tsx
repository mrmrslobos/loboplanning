import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Lightbulb, Zap, Brain, Clock, MessageSquare, 
  CheckCircle, TrendingUp 
} from "lucide-react";

interface ContextualRecommendationsProps {
  className?: string;
}

export function ContextualRecommendations({ className }: ContextualRecommendationsProps) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['/api/ai/productivity-insights'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Right Now Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const enhanced = (insights as any)?.enhanced || {};
  const { contextualInsights, currentEnergyLevel, currentFocusLevel } = enhanced;
  
  if (!contextualInsights) {
    return null;
  }

  const getEnergyColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getFocusColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>Right Now Recommendations</span>
        </CardTitle>
        <CardDescription>
          AI-powered insights for your current context
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current State */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg border ${getEnergyColor(currentEnergyLevel)}`}>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Energy Level</span>
            </div>
            <p className="text-xs mt-1 capitalize">{currentEnergyLevel}</p>
          </div>
          
          <div className={`p-3 rounded-lg border ${getFocusColor(currentFocusLevel)}`}>
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="text-sm font-medium">Focus Level</span>
            </div>
            <p className="text-xs mt-1 capitalize">{currentFocusLevel}</p>
          </div>
        </div>

        {/* Motivational Message */}
        {contextualInsights?.motivationalMessage && (
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {contextualInsights.motivationalMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Recommended Task Types */}
        {contextualInsights?.recommendedTaskTypes && contextualInsights.recommendedTaskTypes.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Best Task Types Right Now</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {contextualInsights.recommendedTaskTypes.map((type: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Productivity Tips */}
        {contextualInsights?.productivityTips && contextualInsights.productivityTips.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>Productivity Tips</span>
            </h4>
            <ul className="space-y-1">
              {contextualInsights.productivityTips.slice(0, 4).map((tip: string, index: number) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start">
                  <span className="mr-2 text-blue-500">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timing Suggestion */}
        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
          <Clock className="h-3 w-3" />
          <span>
            Based on your patterns, this is a {currentEnergyLevel} energy time. 
            {currentEnergyLevel === 'high' && " Perfect for challenging tasks!"}
            {currentEnergyLevel === 'medium' && " Good for routine work."}
            {currentEnergyLevel === 'low' && " Consider easy or creative tasks."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}