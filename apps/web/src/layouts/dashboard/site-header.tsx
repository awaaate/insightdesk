import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  RefreshCcw, 
  Upload, 
  Settings,
  Bell,
  ChevronDown,
  Activity,
  Clock
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 lg:px-8">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 opacity-75 blur"></div>
              <img
                src={`${import.meta.env.VITE_SERVER_URL}/assets/logo.png`}
                alt="InsightDesk"
                width={36}
                height={36}
                className="relative rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold tracking-tight">
                InsightDesk
                <span className="ml-1 text-xs font-normal text-primary">.ai</span>
              </h1>
              <p className="text-xs text-muted-foreground">From feedback to strategic clarity.</p>
            </div>
          </div>
        </div>

        {/* Center Section - Status */}
        <div className="flex flex-1 items-center justify-center gap-6">
          <StatusIndicator />
          <LastUpdate />
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          <div className="flex items-center gap-1 mr-2">
            <ActionButton
              icon={<RefreshCcw className="h-4 w-4" />}
              label="Sync Data"
              tooltip="Synchronize latest data from all sources"
              variant="ghost"
            />
            <ActionButton
              icon={<Upload className="h-4 w-4" />}
              label="Import"
              tooltip="Import data from external sources"
              variant="ghost"
            />
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Notifications */}
          <NotificationButton />

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-border mx-1" />

          {/* User Profile */}
          <UserProfile />
        </div>
      </div>
    </header>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  variant?: "ghost" | "outline" | "default";
}

const ActionButton = ({ icon, label, tooltip, variant = "ghost" }: ActionButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant={variant} 
          size="sm"
          className="h-9 px-3 font-medium transition-all hover:shadow-sm"
        >
          {icon}
          <span className="ml-2 hidden lg:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const StatusIndicator = () => {
  const [status] = useState<"online" | "syncing" | "offline">("online");
  
  const statusConfig = {
    online: { 
      color: "bg-green-500", 
      pulse: true, 
      text: "All Systems Operational",
      icon: <Activity className="h-3 w-3" />
    },
    syncing: { 
      color: "bg-yellow-500", 
      pulse: true, 
      text: "Syncing Data",
      icon: <RefreshCcw className="h-3 w-3 animate-spin" />
    },
    offline: { 
      color: "bg-red-500", 
      pulse: false, 
      text: "Connection Issues",
      icon: <Activity className="h-3 w-3" />
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
      <div className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            config.color
          )} />
        )}
        <span className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          config.color
        )} />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {config.text}
      </span>
    </div>
  );
};

const LastUpdate = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [timeAgo, setTimeAgo] = useState("just now");

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
      
      if (diff < 60) {
        setTimeAgo("just now");
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        setTimeAgo(`${minutes}m ago`);
      } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        setTimeAgo(`${hours}h ago`);
      } else {
        const days = Math.floor(diff / 86400);
        setTimeAgo(`${days}d ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 cursor-default">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Updated {timeAgo}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Last sync: {lastUpdate.toLocaleString()}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const NotificationButton = () => {
  const [hasNotifications] = useState(true);
  const [notificationCount] = useState(3);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {hasNotifications && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 opacity-75"></span>
              <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {notificationCount}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Notifications</span>
            <Badge variant="secondary" className="text-xs">
              {notificationCount} new
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-auto">
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
            <p className="text-sm font-medium">New insights detected</p>
            <p className="text-xs text-muted-foreground">
              5 new patterns found in recent data
            </p>
            <p className="text-xs text-muted-foreground">2 minutes ago</p>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
            <p className="text-sm font-medium">Analysis complete</p>
            <p className="text-xs text-muted-foreground">
              Sentiment analysis finished processing
            </p>
            <p className="text-xs text-muted-foreground">15 minutes ago</p>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
            <p className="text-sm font-medium">System update</p>
            <p className="text-xs text-muted-foreground">
              New features available in dashboard
            </p>
            <p className="text-xs text-muted-foreground">1 hour ago</p>
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-xs font-medium">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const UserProfile = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-9 gap-2 px-2 hover:bg-muted"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground">
            EP
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium leading-none">Eduardo P.</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Eduardo Perez</p>
            <p className="text-xs leading-none text-muted-foreground">
              eduardo@insightdesk.ai
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          Account Preferences
        </DropdownMenuItem>
        <DropdownMenuItem>
          Billing & Usage
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Help & Support
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};