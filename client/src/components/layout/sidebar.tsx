import { Link, useLocation } from "wouter";
import { cn, generateInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, ListTodo, List, Calendar, MessageCircle, 
  Wallet, Utensils, BookOpen, CalendarDays, 
  LogOut, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  color?: string;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/lists", label: "Lists", icon: List },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/meal-planning", label: "Meal Planning", icon: Utensils },
  { href: "/devotional", label: "Devotional", icon: BookOpen },
  { href: "/events", label: "Events", icon: CalendarDays },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 safe-area-top safe-area-bottom",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        data-testid="sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <h1 className="ml-3 text-xl font-bold text-gray-900">LoboHub</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Family Info Card */}
        <div className="p-4 m-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">Johnson Family</span>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              <span className="w-2 h-2 bg-accent rounded-full mr-1"></span>
              4 members
            </Badge>
          </div>
          <div className="text-xs text-primary/70 font-mono">BLUE-OCEAN-74</div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4" data-testid="nav-menu">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-white" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  data-testid={`nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                  {item.badge && (
                    <Badge 
                      variant={item.color as any || "secondary"} 
                      className="ml-auto"
                      data-testid={`badge-${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {item.href === "/chat" && (
                    <span className="ml-auto w-2 h-2 bg-accent rounded-full" data-testid="indicator-chat-online"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center p-3 bg-gray-100 rounded-lg">
            <div className="w-8 h-8 family-gradient rounded-full flex items-center justify-center text-white font-medium text-sm">
              {generateInitials(user?.name || "User")}
            </div>
            <div className="ml-3 flex-1">
              <div className="text-sm font-medium text-gray-900" data-testid="text-user-name">
                {user?.name}
              </div>
              <div className="text-xs text-gray-500" data-testid="text-user-email">
                {user?.email}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-400 hover:text-gray-600"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
