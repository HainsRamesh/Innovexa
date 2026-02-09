import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@/contexts/ChatContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface InterestedUser {
  id: string;
  user_id: string;
  created_at: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    organization_name: string | null;
  } | null;
  role: string | null;
}

interface InterestedUsersSectionProps {
  problemId: string;
}

export const InterestedUsersSection = ({ problemId }: InterestedUsersSectionProps) => {
  const { openChat } = useChat();
  const [users, setUsers] = useState<InterestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInterestedUsers = async () => {
      setIsLoading(true);
      try {
        // Fetch interests that have a user_id (authenticated users only)
        const { data: interests, error } = await supabase
          .from("problem_interests")
          .select("id, user_id, created_at")
          .eq("problem_id", problemId)
          .not("user_id", "is", null);

        if (error) throw error;
        if (!interests || interests.length === 0) {
          setUsers([]);
          setIsLoading(false);
          return;
        }

        // Fetch profiles and roles for each interested user
        const userIds = interests.map(i => i.user_id!).filter(Boolean);
        
        const [profilesRes, rolesRes] = await Promise.all([
          supabase
            .from("public_profiles")
            .select("id, full_name, avatar_url, organization_name")
            .in("id", userIds),
          supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", userIds),
        ]);

        const profileMap = new Map(
          (profilesRes.data || []).map(p => [p.id, p])
        );
        const roleMap = new Map(
          (rolesRes.data || []).map(r => [r.user_id, r.role])
        );

        const enriched: InterestedUser[] = interests
          .filter(i => i.user_id)
          .map(i => ({
            id: i.id,
            user_id: i.user_id!,
            created_at: i.created_at,
            profile: profileMap.get(i.user_id!) || null,
            role: roleMap.get(i.user_id!) || null,
          }));

        setUsers(enriched);
      } catch (err) {
        console.error("Error fetching interested users:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterestedUsers();
  }, [problemId]);

  const handleMessage = (user: InterestedUser) => {
    openChat({
      userId: user.user_id,
      userName: user.profile?.full_name || "User",
      userAvatar: user.profile?.avatar_url,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Interested Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Interested Users
          <Badge variant="secondary" className="ml-1 text-xs">
            {users.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {users.map((user, idx) => (
          <div key={user.id}>
            {idx > 0 && <Separator className="my-2" />}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border/50">
                {user.profile?.avatar_url ? (
                  <AvatarImage src={user.profile.avatar_url} />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                  {user.profile?.full_name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.profile?.full_name || "Anonymous User"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {user.role && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                      {user.role}
                    </Badge>
                  )}
                  {user.profile?.organization_name && (
                    <span className="truncate">{user.profile.organization_name}</span>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0 gap-1.5"
                onClick={() => handleMessage(user)}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Message</span>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
