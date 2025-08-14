import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Tasks from "@/pages/tasks";
import Lists from "@/pages/lists";
import Calendar from "@/pages/calendar";
import Chat from "@/pages/chat";
import Budget from "@/pages/budget";
import Devotional from "@/pages/devotional";
import Events from "@/pages/events";
import MealPlanning from "@/pages/meal-planning";
import FamilySetup from "@/components/family/family-setup";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  if (!user.familyId) {
    return <FamilySetup />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileHeader />
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/lists" component={Lists} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/chat" component={Chat} />
          <Route path="/budget" component={Budget} />
          <Route path="/devotional" component={Devotional} />
          <Route path="/events" component={Events} />
          <Route path="/meal-planning" component={MealPlanning} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AuthenticatedApp />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
