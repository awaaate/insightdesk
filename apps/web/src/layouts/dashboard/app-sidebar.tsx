import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  Link2,
  Search,
  Settings,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

const data = {
  navMain: [
    {
      title: "Main Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      title: "Comment Processing",
      url: "/dashboard/processing",
      icon: <MessageCircle className="w-4 h-4" />,
    },
    {
      title: "AI Takeaways",
      url: "/dashboard/ai-takeaways",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      title: "Agent Logs",
      url: "/dashboard/agent-logs",
      icon: <MessageCircle className="w-4 h-4" />,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      title: "Search",
      url: "#",
      icon: <Search className="w-4 h-4" />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div>InsightsAI</div>
      </SidebarHeader>
      <SidebarContent className="">
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
