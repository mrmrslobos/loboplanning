import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChatWindow } from "@/components/chat/chat-window";
import { TaskForm } from "@/components/tasks/task-form";
import { InviteModal } from "@/components/family/invite-modal";
import { useState } from "react";
import { 
  AlertTriangle, Calendar, DollarSign, Users, Plus, 
  CalendarPlus, Receipt, BookOpen, UserPlus, 
  Clock, MapPin
} from "lucide-react";
import { cn, formatDate, formatTime, isOverdue, generateInitials } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ['/api/tasks'],
    enabled: !!user?.familyId,
  });

  const { data: events } = useQuery({
    queryKey: ['/api/calendar/events'],
    enabled: !!user?.familyId,
  });

  const { data: budgetCategories } = useQuery({
    queryKey: ['/api/budget/categories'],
    enabled: !!user?.familyId,
  });

  const { data: budgetTransactions } = useQuery({
    queryKey: ['/api/budget/transactions'],
    enabled: !!user?.familyId,
  });

  const overdueTasks = tasks?.filter((task: any) => task.dueDate && isOverdue(task.dueDate) && task.status !== 'complete') || [];
  const todaysEvents = events?.filter((event: any) => {
    const eventDate = new Date(event.startTime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }) || [];

  const totalBudget = budgetCategories?.reduce((sum: number, cat: any) => sum + parseFloat(cat.monthlyLimit || '0'), 0) || 0;
  const totalSpent = budgetTransactions?.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0;
  const budgetUsedPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const recentTasks = tasks?.slice(0, 3) || [];
  const upcomingEvents = events?.filter((event: any) => new Date(event.startTime) > new Date()).slice(0, 2) || [];

  const quickActions = [
    { icon: Plus, label: "Add Task", action: () => setShowTaskForm(true), color: "bg-primary-100 text-primary-600" },
    { icon: Plus, label: "New List", action: () => {}, color: "bg-green-100 text-green-600" },
    { icon: CalendarPlus, label: "Add Event", action: () => {}, color: "bg-blue-100 text-blue-600" },
    { icon: Receipt, label: "Log Expense", action: () => {}, color: "bg-purple-100 text-purple-600" },
    { icon: BookOpen, label: "Devotional", action: () => {}, color: "bg-yellow-100 text-yellow-600" },
    { icon: UserPlus, label: "Invite Member", action: () => setShowInviteModal(true), color: "bg-red-100 text-red-600" },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900" data-testid="text-dashboard-greeting">
              Good morning, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">Here's what's happening with your family today</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowTaskForm(true)}
              className="touch-target"
              data-testid="button-quick-add"
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick Add
            </Button>
            <Button 
              onClick={() => setShowInviteModal(true)}
              className="touch-target"
              data-testid="button-invite-family"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Family
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card data-testid="card-overdue-tasks">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xl lg:text-2xl font-bold text-gray-900" data-testid="text-overdue-count">
                    {overdueTasks.length}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">Overdue Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-todays-events">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xl lg:text-2xl font-bold text-gray-900" data-testid="text-events-count">
                    {todaysEvents.length}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">Today's Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-budget-usage">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xl lg:text-2xl font-bold text-gray-900" data-testid="text-budget-percentage">
                    {budgetUsedPercentage}%
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">Budget Used</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-family-members">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xl lg:text-2xl font-bold text-gray-900" data-testid="text-family-count">
                    2
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">Family Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-6 lg:mb-8">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-md transition-shadow duration-200 touch-target" 
              onClick={action.action}
              data-testid={`card-action-${action.label.toLowerCase().replace(' ', '-')}`}
            >
              <CardContent className="p-3 lg:p-4 flex flex-col items-center text-center">
                <div className={cn("w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center mb-2 lg:mb-3", action.color)}>
                  <action.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-gray-900">{action.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Recent Tasks */}
          <Card data-testid="card-recent-tasks">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Tasks</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No tasks yet</p>
              ) : (
                recentTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">
                          {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card data-testid="card-upcoming-events">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Events</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming events</p>
              ) : (
                upcomingEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(event.startTime)} at {formatTime(event.startTime)}
                        </p>
                      </div>
                    </div>
                    {event.location && (
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-20">{event.location}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          <div className="xl:col-span-2">
            <Card data-testid="card-family-activity">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Family Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Family activity feed will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="h-[400px] lg:h-[500px]">
            <ChatWindow />
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onTaskCreated={refetchTasks}
      />
      
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteCode="BLUE-OCEAN-74"
      />
    </div>
  );
}