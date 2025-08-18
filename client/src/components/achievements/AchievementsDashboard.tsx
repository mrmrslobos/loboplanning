import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AchievementBadge } from "./AchievementBadge";
import { FamilyLevelDisplay } from "./FamilyLevelDisplay";
import { Trophy, Star, Target, Users, Calendar, Gift } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'tasks' | 'collaboration' | 'milestones' | 'consistency' | 'special';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface FamilyAchievement {
  id: string;
  badgeId: string;
  unlockedAt: string;
  unlockedBy: string;
}

interface FamilyLevel {
  level: number;
  totalPoints: number;
  currentLevelPoints: number;
  pointsToNextLevel: number;
}

export function AchievementsDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: badgesData, isLoading: isBadgesLoading } = useQuery({
    queryKey: ['/api/achievements/badges'],
    refetchOnWindowFocus: false,
  });

  const { data: familyLevel, isLoading: isLevelLoading } = useQuery<FamilyLevel>({
    queryKey: ['/api/achievements/family-level'],
    refetchOnWindowFocus: false,
  });

  const { data: achievementsData, isLoading: isAchievementsLoading } = useQuery({
    queryKey: ['/api/achievements/family-achievements'],
    refetchOnWindowFocus: false,
  });

  const badges: Badge[] = badgesData?.badges || [];
  const familyAchievements: FamilyAchievement[] = achievementsData?.achievements || [];
  const earnedBadgeIds = new Set(familyAchievements.map(a => a.badgeId));

  const categories = [
    { id: 'all', name: 'All Badges', icon: Trophy },
    { id: 'tasks', name: 'Tasks', icon: Target },
    { id: 'collaboration', name: 'Teamwork', icon: Users },
    { id: 'consistency', name: 'Consistency', icon: Calendar },
    { id: 'milestones', name: 'Milestones', icon: Star },
    { id: 'special', name: 'Special', icon: Gift },
  ];

  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter(badge => badge.category === selectedCategory);

  const earnedBadges = badges.filter(badge => earnedBadgeIds.has(badge.id));
  const availableBadges = badges.filter(badge => !earnedBadgeIds.has(badge.id));

  const getProgressStats = () => {
    const totalBadges = badges.length;
    const earnedCount = earnedBadges.length;
    const progressPercentage = totalBadges > 0 ? (earnedCount / totalBadges) * 100 : 0;
    
    return {
      totalBadges,
      earnedCount,
      progressPercentage: Math.round(progressPercentage)
    };
  };

  const stats = getProgressStats();

  return (
    <div className="space-y-6" data-testid="achievements-dashboard">
      {/* Family Level Display */}
      <FamilyLevelDisplay familyLevel={familyLevel} isLoading={isLevelLoading} />

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Achievement Progress</span>
          </CardTitle>
          <CardDescription>
            Track your family's accomplishments and milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600" data-testid="earned-badges-count">
                {stats.earnedCount}
              </div>
              <div className="text-sm text-muted-foreground">Badges Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600" data-testid="total-badges-count">
                {stats.totalBadges}
              </div>
              <div className="text-sm text-muted-foreground">Total Badges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600" data-testid="completion-percentage">
                {stats.progressPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Completion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600" data-testid="total-points">
                {familyLevel?.totalPoints || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Achievement Badges</CardTitle>
              <CardDescription>
                Unlock badges by completing family activities and milestones
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="flex items-center space-x-1"
                    data-testid={`category-${category.id}`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              {isBadgesLoading || isAchievementsLoading ? (
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Recently Earned */}
                  {earnedBadges.length > 0 && selectedCategory === 'all' && (
                    <div>
                      <h4 className="font-medium text-sm mb-3 flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Recently Earned</span>
                        <Badge variant="secondary">{earnedBadges.length}</Badge>
                      </h4>
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {earnedBadges.slice(0, 8).map((badge) => {
                          const achievement = familyAchievements.find(a => a.badgeId === badge.id);
                          return (
                            <div key={badge.id} className="text-center">
                              <AchievementBadge 
                                badge={badge} 
                                earned={true}
                                earnedAt={achievement ? new Date(achievement.unlockedAt) : undefined}
                              />
                              <p className="text-xs mt-1 font-medium">{badge.name}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All Badges */}
                  <div>
                    <h4 className="font-medium text-sm mb-3">
                      {selectedCategory === 'all' ? 'All Badges' : categories.find(c => c.id === selectedCategory)?.name}
                    </h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                      {filteredBadges.map((badge) => {
                        const isEarned = earnedBadgeIds.has(badge.id);
                        const achievement = familyAchievements.find(a => a.badgeId === badge.id);
                        
                        return (
                          <div key={badge.id} className="text-center">
                            <AchievementBadge 
                              badge={badge} 
                              earned={isEarned}
                              earnedAt={achievement ? new Date(achievement.unlockedAt) : undefined}
                            />
                            <p className={`text-xs mt-1 ${isEarned ? 'font-medium' : 'text-muted-foreground'}`}>
                              {badge.name}
                            </p>
                            <div className="flex items-center justify-center mt-1">
                              <Badge 
                                variant={isEarned ? "default" : "outline"}
                                className="text-xs"
                              >
                                {badge.points} pts
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {filteredBadges.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No badges found in this category.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}