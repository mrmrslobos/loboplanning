// Family Achievement System with Badges and Leveling
// This system gamifies family productivity by tracking achievements and awarding points

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'tasks' | 'collaboration' | 'milestones' | 'consistency' | 'special';
  points: number;
  requirements: {
    type: 'count' | 'streak' | 'percentage' | 'special';
    target: number;
    timeframe?: 'day' | 'week' | 'month' | 'all-time';
    condition?: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENT_BADGES: Badge[] = [
  // Task Completion Badges
  {
    id: 'first_task',
    name: 'Getting Started',
    description: 'Complete your first family task',
    icon: '🎯',
    category: 'tasks',
    points: 10,
    requirements: { type: 'count', target: 1 },
    rarity: 'common'
  },
  {
    id: 'task_master_10',
    name: 'Task Master',
    description: 'Complete 10 tasks',
    icon: '✅',
    category: 'tasks',
    points: 50,
    requirements: { type: 'count', target: 10 },
    rarity: 'common'
  },
  {
    id: 'task_champion_50',
    name: 'Task Champion',
    description: 'Complete 50 tasks',
    icon: '🏆',
    category: 'tasks',
    points: 200,
    requirements: { type: 'count', target: 50 },
    rarity: 'rare'
  },
  {
    id: 'task_legend_100',
    name: 'Task Legend',
    description: 'Complete 100 tasks',
    icon: '👑',
    category: 'tasks',
    points: 500,
    requirements: { type: 'count', target: 100 },
    rarity: 'epic'
  },

  // Consistency Badges
  {
    id: 'daily_driver',
    name: 'Daily Driver',
    description: 'Complete tasks for 7 days in a row',
    icon: '🔥',
    category: 'consistency',
    points: 100,
    requirements: { type: 'streak', target: 7, timeframe: 'day' },
    rarity: 'rare'
  },
  {
    id: 'weekly_warrior',
    name: 'Weekly Warrior',
    description: 'Complete tasks every day for a month',
    icon: '💪',
    category: 'consistency',
    points: 300,
    requirements: { type: 'streak', target: 30, timeframe: 'day' },
    rarity: 'epic'
  },

  // Collaboration Badges
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Have all family members complete tasks in the same week',
    icon: '🤝',
    category: 'collaboration',
    points: 150,
    requirements: { type: 'special', target: 1, condition: 'all_members_active_week' },
    rarity: 'rare'
  },
  {
    id: 'family_harmony',
    name: 'Family Harmony',
    description: 'Complete 20 tasks as a family',
    icon: '👨‍👩‍👧‍👦',
    category: 'collaboration',
    points: 250,
    requirements: { type: 'count', target: 20 },
    rarity: 'epic'
  },

  // List Management Badges
  {
    id: 'list_creator',
    name: 'List Creator',
    description: 'Create your first shopping list',
    icon: '📝',
    category: 'milestones',
    points: 10,
    requirements: { type: 'count', target: 1, condition: 'create_list' },
    rarity: 'common'
  },
  {
    id: 'organized_shopper',
    name: 'Organized Shopper',
    description: 'Complete 10 shopping lists',
    icon: '🛒',
    category: 'milestones',
    points: 75,
    requirements: { type: 'count', target: 10, condition: 'complete_lists' },
    rarity: 'common'
  },

  // Budget Badges
  {
    id: 'budget_tracker',
    name: 'Budget Tracker',
    description: 'Track your first budget transaction',
    icon: '💰',
    category: 'milestones',
    points: 15,
    requirements: { type: 'count', target: 1, condition: 'budget_transaction' },
    rarity: 'common'
  },
  {
    id: 'financial_guru',
    name: 'Financial Guru',
    description: 'Track 100 budget transactions',
    icon: '📊',
    category: 'milestones',
    points: 200,
    requirements: { type: 'count', target: 100, condition: 'budget_transaction' },
    rarity: 'rare'
  },

  // Special Achievement Badges
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a task before 8 AM',
    icon: '🌅',
    category: 'special',
    points: 25,
    requirements: { type: 'special', target: 1, condition: 'task_before_8am' },
    rarity: 'common'
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a task after 10 PM',
    icon: '🦉',
    category: 'special',
    points: 25,
    requirements: { type: 'special', target: 1, condition: 'task_after_10pm' },
    rarity: 'common'
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Have 100% task completion rate for a week',
    icon: '💯',
    category: 'special',
    points: 150,
    requirements: { type: 'percentage', target: 100, timeframe: 'week' },
    rarity: 'epic'
  },
  {
    id: 'family_milestone',
    name: 'Family Milestone',
    description: 'Reach level 10 as a family',
    icon: '🎉',
    category: 'special',
    points: 1000,
    requirements: { type: 'special', target: 10, condition: 'family_level' },
    rarity: 'legendary'
  }
];

// Level progression system
export function calculateLevelFromPoints(totalPoints: number): {
  level: number;
  currentLevelPoints: number;
  pointsToNextLevel: number;
} {
  // Level progression: Level 1: 0-99, Level 2: 100-249, Level 3: 250-449, etc.
  // Formula: points needed for level N = 100 + (N-1) * 150
  
  let level = 1;
  let pointsUsed = 0;
  
  while (true) {
    const pointsNeededForThisLevel = level === 1 ? 100 : 100 + (level - 1) * 150;
    
    if (totalPoints < pointsUsed + pointsNeededForThisLevel) {
      const currentLevelPoints = totalPoints - pointsUsed;
      const pointsToNextLevel = pointsNeededForThisLevel - currentLevelPoints;
      
      return {
        level,
        currentLevelPoints,
        pointsToNextLevel
      };
    }
    
    pointsUsed += pointsNeededForThisLevel;
    level++;
  }
}

// Achievement checking functions
export interface AchievementCheckContext {
  familyId: string;
  userId: string;
  action: 'task_completed' | 'task_created' | 'list_created' | 'list_completed' | 'budget_transaction' | 'chat_message';
  data?: any;
  timestamp: Date;
}

export function checkTaskCompletionAchievements(
  context: AchievementCheckContext,
  taskCount: number,
  completionStreak: number,
  completionTime: Date
): string[] {
  const unlockedBadges: string[] = [];
  
  // Task count badges
  if (taskCount === 1) unlockedBadges.push('first_task');
  if (taskCount === 10) unlockedBadges.push('task_master_10');
  if (taskCount === 50) unlockedBadges.push('task_champion_50');
  if (taskCount === 100) unlockedBadges.push('task_legend_100');
  
  // Streak badges
  if (completionStreak === 7) unlockedBadges.push('daily_driver');
  if (completionStreak === 30) unlockedBadges.push('weekly_warrior');
  
  // Time-based badges
  const hour = completionTime.getHours();
  if (hour < 8) unlockedBadges.push('early_bird');
  if (hour >= 22) unlockedBadges.push('night_owl');
  
  return unlockedBadges;
}

export function checkCollaborationAchievements(
  context: AchievementCheckContext,
  familyTaskCount: number,
  activeMembersThisWeek: number,
  totalFamilyMembers: number
): string[] {
  const unlockedBadges: string[] = [];
  
  if (familyTaskCount === 20) unlockedBadges.push('family_harmony');
  
  if (activeMembersThisWeek === totalFamilyMembers && totalFamilyMembers > 1) {
    unlockedBadges.push('team_player');
  }
  
  return unlockedBadges;
}

export function checkMilestoneAchievements(
  context: AchievementCheckContext,
  listCount: number,
  completedLists: number,
  budgetTransactions: number,
  familyLevel: number
): string[] {
  const unlockedBadges: string[] = [];
  
  if (context.action === 'list_created' && listCount === 1) {
    unlockedBadges.push('list_creator');
  }
  
  if (completedLists === 10) unlockedBadges.push('organized_shopper');
  
  if (context.action === 'budget_transaction') {
    if (budgetTransactions === 1) unlockedBadges.push('budget_tracker');
    if (budgetTransactions === 100) unlockedBadges.push('financial_guru');
  }
  
  if (familyLevel === 10) unlockedBadges.push('family_milestone');
  
  return unlockedBadges;
}

export function calculateBadgePoints(badgeIds: string[]): number {
  return badgeIds.reduce((total, badgeId) => {
    const badge = ACHIEVEMENT_BADGES.find(b => b.id === badgeId);
    return total + (badge?.points || 0);
  }, 0);
}

export function getBadgesByCategory(category: Badge['category']): Badge[] {
  return ACHIEVEMENT_BADGES.filter(badge => badge.category === category);
}

export function getBadgesByRarity(rarity: Badge['rarity']): Badge[] {
  return ACHIEVEMENT_BADGES.filter(badge => badge.rarity === rarity);
}