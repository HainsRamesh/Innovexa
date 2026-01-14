import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Building2, Calendar } from "lucide-react";
import { format } from "date-fns";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { supabase } from "@/integrations/supabase/client";

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

interface HoverProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  organization_name: string | null;
  created_at: string;
}

interface HoverStats {
  innovations: number;
  solutions: number;
  problems: number;
}

interface HoverRole {
  role: string;
}

export const UserHoverCard = ({ userId, children }: UserHoverCardProps) => {
  const { user } = useAuth();
  const { openChat } = useChat();
  const [profile, setProfile] = useState<HoverProfile | null>(null);
  const [stats, setStats] = useState<HoverStats>({ innovations: 0, solutions: 0, problems: 0 });
  const [role, setRole] = useState<HoverRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchData = async () => {
    if (hasLoaded || !userId) return;

    setIsLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("public_profiles")
        .select("id, full_name, avatar_url, bio, organization_name, created_at")
        .eq("id", userId)
        .maybeSingle();

      setProfile(profileData);

      // Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      setRole(roleData);

      // Fetch stats
      const [innovations, solutions, problems] = await Promise.all([
        supabase
          .from("innovations")
          .select("*", { count: "exact", head: true })
          .eq("innovator_id", userId)
          .in("status", ["published", "featured"]),
        supabase
          .from("solutions")
          .select("*", { count: "exact", head: true })
          .eq("innovator_id", userId)
          .neq("status", "draft"),
        supabase
          .from("problems")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", userId)
          .neq("status", "draft"),
      ]);

      setStats({
        innovations: innovations.count || 0,
        solutions: solutions.count || 0,
        problems: problems.count || 0,
      });

      setHasLoaded(true);
    } catch (error) {
      console.error("Error fetching hover card data:", error);
    } finally {
      setIsLoading(false);
    }
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

  const getRoleBadgeColor = (r: string) => {
    switch (r) {
      case "innovator":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "investor":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "enterprise":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "admin":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleMessage = () => {
    openChat({
      userId,
      userName: profile?.full_name || null,
      userAvatar: profile?.avatar_url,
    });
  };

  const isOwnProfile = user?.id === userId;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild onMouseEnter={fetchData}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top" align="start">
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ) : profile ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Link to={`/profile/${userId}`}>
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-sm">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/profile/${userId}`}
                  className="font-semibold text-sm hover:underline block truncate"
                >
                  {profile.full_name || "User"}
                </Link>
                {role && (
                  <Badge className={`text-xs mt-0.5 ${getRoleBadgeColor(role.role)}`}>
                    {role.role.charAt(0).toUpperCase() + role.role.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {profile.organization_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {profile.organization_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {format(new Date(profile.created_at), "MMM yyyy")}
              </span>
            </div>

            <div className="flex gap-4 text-xs">
              <span>
                <strong>{stats.innovations}</strong>{" "}
                <span className="text-muted-foreground">Innovations</span>
              </span>
              <span>
                <strong>{stats.solutions}</strong>{" "}
                <span className="text-muted-foreground">Solutions</span>
              </span>
              <span>
                <strong>{stats.problems}</strong>{" "}
                <span className="text-muted-foreground">Problems</span>
              </span>
            </div>

            {!isOwnProfile && user && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleMessage}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">User not found</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};
