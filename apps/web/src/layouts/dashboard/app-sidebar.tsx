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
import { NavBrand } from "./nav-brand";
import {
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  Link2,
  Search,
  Settings,
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
      title: "Attributes Analysis",
      url: "/dashboard/attributes",
      icon: <Lightbulb className="w-4 h-4" />,
    },
    {
      title: "Sources Analysis",
      url: "/dashboard/sources",
      icon: <Link2 className="w-4 h-4" />,
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
        <NavBrand />
      </SidebarHeader>
      <SidebarContent className="">
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
