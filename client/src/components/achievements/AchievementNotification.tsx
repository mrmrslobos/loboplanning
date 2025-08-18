import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Achievement {
  id: string;
  badgeId: string;
  badge: {
    name: string;
    description: string;
    icon: string;
    points: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

interface AchievementNotificationProps {
  achievements: Achievement[];
  pointsEarned: number;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function AchievementNotification({ 
  achievements, 
  pointsEarned, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getIconComponent = () => {
    if (achievements.length === 1) {
      const rarity = achievements[0].badge.rarity;
      if (rarity === 'legendary') return <Gift className="h-6 w-6 text-yellow-500" />;
      if (rarity === 'epic') return <Star className="h-6 w-6 text-purple-500" />;
    }
    return <Trophy className="h-6 w-6 text-yellow-500" />;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.5 
          }}
          className="fixed top-4 right-4 z-50 max-w-sm"
          data-testid="achievement-notification"
        >
          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse">
                    {getIconComponent()}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Achievement Unlocked!
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      +{pointsEarned} pts
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {achievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="flex items-center space-x-2">
                        <span className="text-lg" data-testid={`achievement-icon-${achievement.badgeId}`}>
                          {achievement.badge.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {achievement.badge.name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {achievement.badge.description}
                          </p>
                        </div>
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getRarityColor(achievement.badge.rarity)}`}></div>
                      </div>
                    ))}
                    
                    {achievements.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{achievements.length - 3} more achievement{achievements.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                      data-testid="close-achievement-notification"
                    >
                      Dismiss
                    </button>
                    <div className="text-xs text-gray-500">
                      {achievements.length} badge{achievements.length > 1 ? 's' : ''} earned
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}