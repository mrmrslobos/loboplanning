import { AchievementsDashboard } from "@/components/achievements/AchievementsDashboard";

export default function AchievementsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Family Achievements</h1>
        <p className="text-muted-foreground">
          Track your family's progress and unlock badges together
        </p>
      </div>
      
      <AchievementsDashboard />
    </div>
  );
}