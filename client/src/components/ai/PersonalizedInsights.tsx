import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, Zap, Clock, TrendingUp, Target, 
  Users, AlertCircle, CheckCircle, Calendar,
  Lightbulb, Coffee, Moon, Sun
} from "lucide-react";

interface BehaviorProfile {
  productivityPatterns: {
    peakHours: string[];
    preferredTaskDuration: string;
    energyLevels: Record<string, 'low' | 'medium' | 'high'>;
    focusPatterns: Record<string, 'low' | 'medium' | 'high'>;
  };
  motivationalFactors: {
    streakMotivated: boolean;
    collaborationDriven: boolean;
    achievementOriented: boolean;
    deadlineDriven: boolean;
  };
  currentStreak: number;
  insights?: {
    procrastinationTriggers: string[];
    productivityBoosts: string[];
    optimalTaskSequencing: string[];
    burnoutIndicators: string[];
  };
}

interface PersonalizedInsightsProps {
  behaviorProfile: BehaviorProfile;
  isLoading?: boolean;
}

export function PersonalizedInsights({ behaviorProfile, isLoading }: PersonalizedInsightsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Personal AI Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTimeIcon = (time: string) => {
    switch (time.toLowerCase()) {
      case 'morning': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'afternoon': return <Sun className="h-4 w-4 text-orange-500" />;
      case 'evening': return <Moon className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEnergyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getMotivationIcon = (factor: string) => {
    switch (factor) {
      case 'streakMotivated': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'collaborationDriven': return <Users className="h-4 w-4 text-blue-600" />;
      case 'achievementOriented': return <Target className="h-4 w-4 text-purple-600" />;
      case 'deadlineDriven': return <Calendar className="h-4 w-4 text-red-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const activeMotivators = Object.entries(behaviorProfile.motivationalFactors)
    .filter(([_, value]) => value)
    .map(([key, _]) => key);

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Personal AI Insights</span>
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your productivity patterns and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Streak */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Current Streak</p>
                <p className="text-sm text-gray-600">Recent completed tasks</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{behaviorProfile.currentStreak}</p>
              <p className="text-xs text-gray-500">tasks</p>
            </div>
          </div>

          {/* Peak Hours */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Your Peak Productivity Times</span>
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {['morning', 'afternoon', 'evening'].map((time) => {
                const isActive = behaviorProfile.productivityPatterns.peakHours.includes(time);
                const energyLevel = behaviorProfile.productivityPatterns.energyLevels[time] || 'medium';
                
                return (
                  <div
                    key={time}
                    className={`p-3 rounded-lg border text-center ${
                      isActive 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {getTimeIcon(time)}
                    </div>
                    <p className="text-xs font-medium capitalize">{time}</p>
                    <div className="flex items-center justify-center mt-1">
                      <div className={`w-2 h-2 rounded-full ${getEnergyColor(energyLevel)}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferred Task Duration */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Preferred Duration</span>
            </div>
            <Badge variant="outline">{behaviorProfile.productivityPatterns.preferredTaskDuration}</Badge>
          </div>

          {/* Motivational Factors */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span>What Motivates You</span>
            </h4>
            <div className="space-y-2">
              {activeMotivators.length > 0 ? (
                activeMotivators.map((factor) => (
                  <div key={factor} className="flex items-center space-x-2 p-2 bg-purple-50 rounded">
                    {getMotivationIcon(factor)}
                    <span className="text-sm capitalize">
                      {factor.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Learning your motivation patterns...</p>
              )}
            </div>
          </div>

          {/* AI Insights */}
          {behaviorProfile.insights && (
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span>AI Insights</span>
              </h4>
              
              {/* Productivity Boosts */}
              {behaviorProfile.insights.productivityBoosts.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-green-700 mb-1">Productivity Boosters</p>
                  <ul className="space-y-1">
                    {behaviorProfile.insights.productivityBoosts.slice(0, 3).map((boost, idx) => (
                      <li key={idx} className="text-xs text-green-600 flex items-start">
                        <CheckCircle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{boost}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Procrastination Triggers */}
              {behaviorProfile.insights.procrastinationTriggers.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-red-700 mb-1">Watch Out For</p>
                  <ul className="space-y-1">
                    {behaviorProfile.insights.procrastinationTriggers.slice(0, 2).map((trigger, idx) => (
                      <li key={idx} className="text-xs text-red-600 flex items-start">
                        <AlertCircle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{trigger}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Optimal Sequencing */}
              {behaviorProfile.insights.optimalTaskSequencing.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-blue-700 mb-1">Task Sequencing Tips</p>
                  <ul className="space-y-1">
                    {behaviorProfile.insights.optimalTaskSequencing.slice(0, 2).map((tip, idx) => (
                      <li key={idx} className="text-xs text-blue-600 flex items-start">
                        <Coffee className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}