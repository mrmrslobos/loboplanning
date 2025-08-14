import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { useState } from "react";

export function MobileHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="button-open-sidebar"
      >
        <Menu className="h-5 w-5 text-gray-500" />
      </Button>
      
      <h1 className="text-lg font-bold text-gray-900">LoboHub</h1>
      
      <Button
        variant="ghost"
        size="sm"
        data-testid="button-notifications"
      >
        <Bell className="h-5 w-5 text-gray-500" />
      </Button>
    </div>
  );
}
