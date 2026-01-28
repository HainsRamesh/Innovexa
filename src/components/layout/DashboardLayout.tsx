import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Lightbulb,
  LayoutDashboard,
  FileText,
  Sparkles,
  Bookmark,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  TrendingUp,
  Building2,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppRole } from "@/types";
import { NotificationBell } from "@/components/notifications";
import { MessagesBell } from "@/components/messaging/MessagesBell";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles: AppRole[];
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    roles: ["admin", "innovator", "enterprise", "investor"],
  },
  {
    label: "My Innovations",
    href: "/dashboard/innovations",
    icon: <Lightbulb className="h-4 w-4" />,
    roles: ["innovator", "admin"],
  },
  {
    label: "My Solutions",
    href: "/dashboard/solutions",
    icon: <Sparkles className="h-4 w-4" />,
    roles: ["innovator", "admin"],
  },
  {
    label: "My Problems",
    href: "/dashboard/problems",
    icon: <FileText className="h-4 w-4" />,
    roles: ["enterprise", "admin"],
  },
  {
    label: "Browse Problems",
    href: "/dashboard/browse",
    icon: <Rocket className="h-4 w-4" />,
    roles: ["innovator"],
  },
  {
    label: "Investments",
    href: "/dashboard/investments",
    icon: <TrendingUp className="h-4 w-4" />,
    roles: ["investor"],
  },
  {
    label: "Organizations",
    href: "/dashboard/organizations",
    icon: <Building2 className="h-4 w-4" />,
    roles: ["admin"],
  },
  { label: "Users", href: "/dashboard/users", icon: <Users className="h-4 w-4" />, roles: ["admin"] },
  {
    label: "Bookmarks",
    href: "/dashboard/bookmarks",
    icon: <Bookmark className="h-4 w-4" />,
    roles: ["admin", "innovator", "enterprise", "investor"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-4 w-4" />,
    roles: ["admin", "innovator", "enterprise", "investor"],
  },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredNavItems = navItems.filter((item) => role && item.roles.includes(role));

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === `/dashboard/${role}`;
    }
    if (href === "/dashboard/browse") {
      return location.pathname.startsWith("/dashboard/browse");
    }
    if (href === "/dashboard/innovations") {
      // Match /dashboard/innovations but NOT /dashboard/innovations/:id (view/edit pages return to innovations list)
      return location.pathname === "/dashboard/innovations";
    }
    if (href === "/dashboard/solutions") {
      return location.pathname === "/dashboard/solutions";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
            <Link to="/" className="flex items-center group">
              <img src="/zynovexa-logo.png" alt="Zynovexa" className="h-12 w-12 object-contain" />
              <span className="text-lg font-bold text-sidebar-foreground">ZYNOVEXA</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive(item.href)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-9 w-9 border border-sidebar-border">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || "User"}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-30">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Messages Bell */}
              <MessagesBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-secondary text-foreground text-xs">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
