import {
  LayoutDashboard,
  Users,
  Mail,
  Share2,
  CalendarClock,
  Cpu,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Participants", url: "/participants", icon: Users },
  { title: "Email Automation", url: "/email-automation", icon: Mail },
  { title: "Social Media Agent", url: "/social-media", icon: Share2 },
  { title: "Event Scheduler", url: "/scheduler", icon: CalendarClock },
  { title: "Swarm Control Center", url: "/swarm-control", icon: Cpu },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary glow-cyan">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-slide-in-left">
              <p className="text-sm font-bold text-sidebar-accent-foreground">Swarm AI</p>
              <p className="text-[10px] text-sidebar-foreground">Event Logistics</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="glass-card rounded-lg p-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse-slow" />
              <span className="text-xs text-sidebar-foreground">8 agents online</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
