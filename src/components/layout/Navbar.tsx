import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb, Menu, X } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
}

export const Navbar = () => {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Get logo redirect based on role
  const getLogoRedirect = () => {
    if (!user) return "/";
    switch (role) {
      case "innovator":
      case "investor":
        return "/innovations";
      case "enterprise":
        return "/explore";
      default:
        return "/innovations";
    }
  };

  // Get navigation items based on auth state and role
  const navItems = useMemo((): NavItem[] => {
    if (!user) {
      // Pre-login: No navigation links (Landing is accessed via logo)
      return [];
    }

    // Post-login: Show role-specific navigation in correct order
    switch (role) {
      case "innovator":
        return [
          { label: "Innovations", path: "/innovations" },
          { label: "Explore Problems", path: "/explore" },
          { label: "Solutions", path: "/solutions" },
        ];
      case "enterprise":
        return [
          { label: "Explore Problems", path: "/explore" },
          { label: "Innovations", path: "/innovations" },
          { label: "Solutions", path: "/solutions" },
        ];
      case "investor":
        return [
          { label: "Innovations", path: "/innovations" },
          { label: "Explore Problems", path: "/explore" },
          { label: "Solutions", path: "/solutions" },
        ];
      default:
        return [
          { label: "Innovations", path: "/innovations" },
          { label: "Explore Problems", path: "/explore" },
          { label: "Solutions", path: "/solutions" },
        ];
    }
  }, [user, role]);

  const getDashboardLink = () => {
    if (!role) return "/dashboard";
    return `/dashboard/${role}`;
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

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={getLogoRedirect()} className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Lightbulb className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">INNOVEXA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm transition-colors relative py-1",
                  isActiveRoute(item.path) ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {isActiveRoute(item.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to={getDashboardLink()}>Dashboard</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-primary/30">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                        <AvatarFallback className="bg-secondary text-foreground">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        <p className="text-xs text-primary capitalize">{role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardLink()}>Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-sm transition-colors pl-2 border-l-2",
                    isActiveRoute(item.path)
                      ? "text-primary font-medium border-primary"
                      : "text-muted-foreground hover:text-foreground border-transparent",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" className="justify-start text-destructive" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button variant="hero" asChild>
                      <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
