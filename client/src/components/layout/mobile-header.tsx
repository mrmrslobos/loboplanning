import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Download } from "lucide-react";

interface MobileHeaderProps {
  onToggleSidebar: () => void;
}

export function MobileHeader({ onToggleSidebar }: MobileHeaderProps) {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40 safe-area-top">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleSidebar}
        className="touch-target"
        data-testid="button-open-sidebar"
      >
        <Menu className="h-5 w-5 text-gray-500" />
      </Button>
      
      <h1 className="text-lg font-bold text-gray-900">LoboHub</h1>
      
      <div className="flex items-center space-x-2">
        {showInstallPrompt && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleInstallClick}
            className="touch-target"
            data-testid="button-install-pwa"
            title="Install LoboHub"
          >
            <Download className="h-4 w-4 text-blue-600" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="touch-target"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5 text-gray-500" />
        </Button>
      </div>
    </div>
  );
}
