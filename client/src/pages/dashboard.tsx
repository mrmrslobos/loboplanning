import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ChatWindow } from "@/components/chat/chat-window";
import { TaskForm } from "@/components/tasks/task-form";
import { InviteModal } from "@/components/family/invite-modal";
import { useState } from "react";
import { 
  AlertTriangle, Calendar, DollarSign, Users, Plus, 
  CalendarPlus, Receipt, BookOpen, UserPlus, CheckCircle,
  Clock, MapPin, User
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

  const overdueTasks = tasks?.filter(task => task.dueDate && isOverdue(task.dueDate) && task.status !== 'done') || [];
  const todaysEvents = events?.filter(event => {
    const eventDate = new Date(event.startTime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }) || [];

  const totalBudget = budgetCategories?.reduce((sum, cat) => sum + parseFloat(cat.monthlyLimit || '0'), 0) || 0;
  const totalSpent = budgetTransactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const budgetUsedPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const recentTasks = tasks?.slice(0, 3) || [];
  const upcomingEvents = events?.filter(event => new Date(event.startTime) > new Date()).slice(0, 2) || [];

  const quickActions = [
    { icon: Plus, label: "Add Task", action: () => setShowTaskForm(true), color: "bg-primary-100 text-primary-600" },
    { icon: Plus, label: "New List", action: () => {}, color: "bg-green-100 text-green-600" },
    { icon: CalendarPlus, label: "Add Event", action: () => {}, color: "bg-blue-100 text-blue-600" },
    { icon: Receipt, label: "Log Expense", action: () => {}, color: "bg-purple-100 text-purple-600" },
    { icon: BookOpen, label: "Devotional", action: () => {}, color: "bg-yellow-100 text-yellow-600" },
    { icon: UserPlus, label: "Invite Member", action: () => setShowInviteModal(true), color: "bg-red-100 text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-dashboard-greeting">
              Good morning, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">Here's what's happening with your family today</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Button 
              variant="outline"
              onClick={() => setShowTaskForm(true)}
              data-testid="button-quick-add"
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick Add
            </Button>
            <Button 
              onClick={() => setShowInviteModal(true)}
              data-testid="button-invite-family"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Family
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-overdue-tasks">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-overdue-count">
                    {overdueTasks.length}
                  </p>
                  <p className="text-sm text-gray-600">Overdue Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-todays-events">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-events-count">
                    {todaysEvents.length}
                  </p>
                  <p className="text-sm text-gray-600">Today's Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-budget-used">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-budget-percentage">
                    {budgetUsedPercentage}%
                  </p>
                  <p className="text-sm text-gray-600">Budget Used</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-family-online">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-online-count">
                    3/4
                  </p>
                  <p className="text-sm text-gray-600">Online Now</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Tasks */}
          <div className="lg:col-span-2">
            <Card data-testid="card-recent-tasks">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Tasks</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">View All</Button>
                    <Button size="sm" onClick={() => setShowTaskForm(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Task
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No tasks yet. Create your first task!</p>
                    </div>
                  ) : (
                    recentTasks.map((task) => (
                      <div 
                        key={task.id}
                        className={cn(
                          "flex items-center justify-between p-4 border rounded-lg",
                          task.priority === 'high' && "task-priority-high",
                          task.priority === 'medium' && "task-priority-medium",
                          task.priority === 'low' && "task-priority-low",
                          task.status === 'done' && "bg-gray-50"
                        )}
                        data-testid={`task-item-${task.id}`}
                      >
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={task.status === 'done'}
                            className="w-4 h-4 text-primary border-gray-300 rounded"
                            readOnly
                          />
                          <div className="ml-4">
                            <h4 className={cn(
                              "text-sm font-medium",
                              task.status === 'done' ? "text-gray-500 line-through" : "text-gray-900"
                            )}>
                              {task.title}
                            </h4>
                            <div className="flex items-center mt-1 space-x-3">
                              <Badge variant={
                                task.priority === 'high' ? 'destructive' : 
                                task.priority === 'medium' ? 'default' : 
                                'secondary'
                              }>
                                {task.priority} Priority
                              </Badge>
                              {task.dueDate && (
                                <span className="text-xs text-gray-500">
                                  Due: {formatDate(task.dueDate)}
                                </span>
                              )}
                              <Badge variant="outline">
                                {task.familyId ? 'Shared' : 'Private'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {generateInitials(user?.name || "U")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Family Chat */}
          <div className="h-96">
            <ChatWindow />
          </div>
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upcoming Events */}
          <Card data-testid="card-upcoming-events">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Events</CardTitle>
                <Button variant="ghost" size="sm">View Calendar</Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No upcoming events. Create your first event!</p>
                  </div>
                ) : (
                  upcomingEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      data-testid={`event-item-${event.id}`}
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white">
                        <span className="text-xs font-medium">
                          {new Date(event.startTime).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-sm font-bold">
                          {new Date(event.startTime).getDate()}
                        </span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </p>
                        {event.location && (
                          <div className="flex items-center mt-1">
                            <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">{event.location}</span>
                          </div>
                        )}
                        <Badge variant="outline" className="mt-1">
                          {event.familyId ? 'Shared Event' : 'Private Event'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <Card data-testid="card-budget-overview">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle>March Budget</CardTitle>
                <Button variant="ghost" size="sm">View Details</Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Spent</span>
                  <span className="text-sm font-bold text-gray-900">
                    ${totalSpent.toFixed(2)} / ${totalBudget.toFixed(2)}
                  </span>
                </div>
                <Progress value={budgetUsedPercentage} className="h-3" />
              </div>
              
              <div className="space-y-3">
                {budgetCategories?.slice(0, 4).map((category, index) => {
                  const categorySpent = budgetTransactions?.filter(t => 
                    t.categoryId === category.id && t.type === 'expense'
                  ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
                  
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'];
                  
                  return (
                    <div key={category.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={cn("w-3 h-3 rounded-full mr-3", colors[index % colors.length])}></div>
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        ${categorySpent.toFixed(2)}
                      </span>
                    </div>
                  );
                }) || (
                  <div className="text-center py-4 text-gray-500">
                    <p>No budget categories yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <Card data-testid="card-quick-actions">
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className="flex flex-col items-center p-4 h-auto bg-gray-50 hover:bg-gray-100"
                    onClick={action.action}
                    data-testid={`button-quick-${action.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-2", action.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>

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
