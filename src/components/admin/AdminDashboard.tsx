import { useEffect, useState } from "react";
import { 
  Users, 
  FileText, 
  Lightbulb, 
  MessageSquare, 
  TrendingUp,
  AlertTriangle,
  Activity,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProblems: number;
  totalSolutions: number;
  totalInnovations: number;
  totalMessages: number;
  pendingReports: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch counts in parallel
        const [
          { count: usersCount },
          { count: problemsCount },
          { count: solutionsCount },
          { count: innovationsCount },
          { count: messagesCount },
          { count: reportsCount },
        ] = await Promise.all([
          supabase.from("public_profiles").select("*", { count: "exact", head: true }),
          supabase.from("problems").select("*", { count: "exact", head: true }),
          supabase.from("solutions").select("*", { count: "exact", head: true }),
          supabase.from("innovations").select("*", { count: "exact", head: true }),
          supabase.from("messages").select("*", { count: "exact", head: true }),
          supabase.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        ]);

        // Calculate active users (users with activity in last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { count: activeUsersCount } = await supabase
          .from("messages")
          .select("sender_id", { count: "exact", head: true })
          .gte("created_at", weekAgo.toISOString());

        setStats({
          totalUsers: usersCount || 0,
          activeUsers: activeUsersCount || 0,
          totalProblems: problemsCount || 0,
          totalSolutions: solutionsCount || 0,
          totalInnovations: innovationsCount || 0,
          totalMessages: messagesCount || 0,
          pendingReports: reportsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      title: "Total Users", 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      title: "Active Users (7d)", 
      value: stats?.activeUsers || 0, 
      icon: Activity, 
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      title: "Problems", 
      value: stats?.totalProblems || 0, 
      icon: FileText, 
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    { 
      title: "Solutions", 
      value: stats?.totalSolutions || 0, 
      icon: Briefcase, 
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    { 
      title: "Innovations", 
      value: stats?.totalInnovations || 0, 
      icon: Lightbulb, 
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    { 
      title: "Messages", 
      value: stats?.totalMessages || 0, 
      icon: MessageSquare, 
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    { 
      title: "Pending Reports", 
      value: stats?.pendingReports || 0, 
      icon: AlertTriangle, 
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
