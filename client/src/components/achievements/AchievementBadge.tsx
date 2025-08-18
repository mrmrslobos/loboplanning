import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'tasks' | 'collaboration' | 'milestones' | 'consistency' | 'special';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementBadgeProps {
  badge: Badge;
  earned: boolean;
  earnedAt?: Date;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function AchievementBadge({ 
  badge, 
  earned, 
  earnedAt, 
  size = 'md', 
  showTooltip = true 
}: AchievementBadgeProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'rare': return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'epic': return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'legendary': return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm': return 'w-12 h-12 text-lg';
      case 'md': return 'w-16 h-16 text-2xl';
      case 'lg': return 'w-20 h-20 text-3xl';
      default: return 'w-16 h-16 text-2xl';
    }
  };

  const badgeElement = (
    <div
      className={`
        relative rounded-full border-2 flex items-center justify-center
        transition-all duration-200 cursor-pointer
        ${getSizeClasses(size)}
        ${earned 
          ? getRarityColor(badge.rarity) + ' opacity-100 hover:scale-105' 
          : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
        }
      `}
      data-testid={`badge-${badge.id}`}
    >
      <span className="font-medium">{badge.icon}</span>
      
      {earned && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
      
      {!earned && (
        <div className="absolute inset-0 bg-gray-300 bg-opacity-50 rounded-full flex items-center justify-center">
          <span className="text-gray-500 text-xs">🔒</span>
        </div>
      )}
    </div>
  );

  if (!showTooltip) return badgeElement;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badgeElement}
      </TooltipTrigger>
      <TooltipContent>
        <div className="max-w-xs p-2">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{badge.icon}</span>
            <div>
              <h4 className="font-semibold text-sm">{badge.name}</h4>
              <ShadcnBadge variant="outline" className="text-xs">
                {badge.rarity}
              </ShadcnBadge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-600 font-medium">{badge.points} points</span>
            {earned && earnedAt && (
              <span className="text-muted-foreground">
                Earned {earnedAt.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}