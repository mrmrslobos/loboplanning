import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, TrendingUp } from "lucide-react";

interface FamilyLevel {
  level: number;
  totalPoints: number;
  currentLevelPoints: number;
  pointsToNextLevel: number;
}

interface FamilyLevelDisplayProps {
  familyLevel?: FamilyLevel;
  isLoading?: boolean;
}

export function FamilyLevelDisplay({ familyLevel, isLoading }: FamilyLevelDisplayProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const level = familyLevel?.level || 1;
  const totalPoints = familyLevel?.totalPoints || 0;
  const currentLevelPoints = familyLevel?.currentLevelPoints || 0;
  const pointsToNextLevel = familyLevel?.pointsToNextLevel || 100;
  const progressPercentage = (currentLevelPoints / (currentLevelPoints + pointsToNextLevel)) * 100;

  const getLevelTitle = (level: number): string => {
    if (level >= 50) return "Legendary Family";
    if (level >= 30) return "Epic Family";
    if (level >= 20) return "Super Family";
    if (level >= 10) return "Great Family";
    if (level >= 5) return "Good Family";
    return "Growing Family";
  };

  const getLevelIcon = (level: number): React.ReactNode => {
    if (level >= 50) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (level >= 30) return <Star className="h-5 w-5 text-purple-500" />;
    if (level >= 10) return <TrendingUp className="h-5 w-5 text-blue-500" />;
    return <Star className="h-5 w-5 text-green-500" />;
  };

  const getLevelColor = (level: number): string => {
    if (level >= 50) return "bg-gradient-to-r from-yellow-400 to-orange-500";
    if (level >= 30) return "bg-gradient-to-r from-purple-400 to-pink-500";
    if (level >= 20) return "bg-gradient-to-r from-blue-400 to-indigo-500";
    if (level >= 10) return "bg-gradient-to-r from-green-400 to-blue-500";
    if (level >= 5) return "bg-gradient-to-r from-emerald-400 to-green-500";
    return "bg-gradient-to-r from-gray-400 to-gray-500";
  };

  return (
    <Card className="relative overflow-hidden" data-testid="family-level-card">
      {/* Background Gradient */}
      <div className={`absolute inset-0 ${getLevelColor(level)} opacity-10`}></div>
      
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getLevelIcon(level)}
            <div>
              <CardTitle className="text-lg" data-testid="family-level-title">
                Level {level}
              </CardTitle>
              <CardDescription data-testid="family-level-description">
                {getLevelTitle(level)}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary" data-testid="total-points">
              {totalPoints.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative pt-0">
        {/* Progress to Next Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {level + 1}</span>
            <Badge variant="outline" className="text-xs" data-testid="points-to-next-level">
              {pointsToNextLevel} points needed
            </Badge>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-2" 
            data-testid="level-progress"
          />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{currentLevelPoints} / {currentLevelPoints + pointsToNextLevel}</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
        </div>

        {/* Level Milestones */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Next milestone rewards:</span>
            <div className="flex space-x-1">
              {level < 5 && <Badge variant="secondary" className="text-xs">+50 points at Level 5</Badge>}
              {level < 10 && <Badge variant="secondary" className="text-xs">+100 points at Level 10</Badge>}
              {level < 20 && <Badge variant="secondary" className="text-xs">Special badge at Level 20</Badge>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}