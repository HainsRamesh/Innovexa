import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Building2,
  Globe,
  Lightbulb,
  Target,
  CheckCircle,
  Heart,
  Briefcase,
  Loader2,
  UserX,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Problem, Solution, Innovation } from "@/types";
import { ProfileActionButtons } from "@/components/profile";

interface PublicProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  organization_name: string | null;
  organization_type: string | null;
  website: string | null;
  created_at: string;
}

interface UserStats {
  problemsPosted: number;
  solutionsSubmitted: number;
  solutionsApproved: number;
  likesReceived: number;
  investmentsMade: number;
  innovationsPublished: number;
}

interface UserRole {
  role: "admin" | "innovator" | "enterprise" | "investor";
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solutions, setSolutions] = useState<(Solution & { problem_title?: string })[]>([]);
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const fetchProfileData = async () => {
    if (!userId) return;

    setIsLoading(true);
    setNotFound(false);

    try {
      // Fetch public profile
      const { data: profileData, error: profileError } = await supabase
        .from("public_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        setNotFound(true);
        return;
      }

      setProfile(profileData);

      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      setUserRole(roleData);

      // Fetch stats in parallel
      await Promise.all([
        fetchStats(userId),
        fetchProblems(userId),
        fetchSolutions(userId),
        fetchInnovations(userId),
      ]);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (uid: string) => {
    try {
      // Problems posted
      const { count: problemsCount } = await supabase
        .from("problems")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", uid)
        .neq("status", "draft");

      // Solutions submitted
      const { count: solutionsCount } = await supabase
        .from("solutions")
        .select("*", { count: "exact", head: true })
        .eq("innovator_id", uid)
        .neq("status", "draft");

      // Solutions approved
      const { count: approvedCount } = await supabase
        .from("solutions")
        .select("*", { count: "exact", head: true })
        .eq("innovator_id", uid)
        .eq("status", "accepted");

      // Total interests on problems
      const { data: userProblems } = await supabase
        .from("problems")
        .select("interest_count")
        .eq("owner_id", uid);

      const problemInterests = userProblems?.reduce((sum, p) => sum + (p.interest_count || 0), 0) || 0;

      // Total interests on innovations
      const { data: userInnovations } = await supabase
        .from("innovations")
        .select("interest_count")
        .eq("innovator_id", uid);

      const innovationInterests = userInnovations?.reduce((sum, i) => sum + (i.interest_count || 0), 0) || 0;

      // Investments made (only visible to the investor themselves or publicly available count)
      let investmentsMade = 0;
      if (user?.id === uid) {
        const { count: investmentsCount } = await supabase
          .from("investments")
          .select("*", { count: "exact", head: true })
          .eq("investor_id", uid);
        investmentsMade = investmentsCount || 0;
      }

      // Innovations published
      const { count: innovationsCount } = await supabase
        .from("innovations")
        .select("*", { count: "exact", head: true })
        .eq("innovator_id", uid)
        .in("status", ["published", "featured"]);

      setStats({
        problemsPosted: problemsCount || 0,
        solutionsSubmitted: solutionsCount || 0,
        solutionsApproved: approvedCount || 0,
        likesReceived: problemInterests + innovationInterests,
        investmentsMade,
        innovationsPublished: innovationsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchProblems = async (uid: string) => {
    try {
      const { data } = await supabase
        .from("problems")
        .select("*")
        .eq("owner_id", uid)
        .neq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(10);

      setProblems((data as Problem[]) || []);
    } catch (error) {
      console.error("Error fetching problems:", error);
    }
  };

  const fetchSolutions = async (uid: string) => {
    try {
      const { data } = await supabase
        .from("solutions")
        .select("*, problems(title)")
        .eq("innovator_id", uid)
        .neq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(10);

      const solutionsWithTitles = (data || []).map((s: any) => ({
        ...s,
        problem_title: s.problems?.title,
      }));

      setSolutions(solutionsWithTitles);
    } catch (error) {
      console.error("Error fetching solutions:", error);
    }
  };

  const fetchInnovations = async (uid: string) => {
    try {
      const { data } = await supabase
        .from("innovations")
        .select("*")
        .eq("innovator_id", uid)
        .in("status", ["published", "featured"])
        .order("created_at", { ascending: false })
        .limit(10);

      setInnovations((data as Innovation[]) || []);
    } catch (error) {
      console.error("Error fetching innovations:", error);
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
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

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-8 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <ProfileSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 pb-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <UserX className="h-24 w-24 text-muted-foreground/30 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The profile you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-8 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar */}
                <Avatar className="h-28 w-28 ring-4 ring-primary/20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl bg-muted">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h1 className="text-2xl font-bold">
                        {profile?.full_name || "Anonymous User"}
                      </h1>
                      {userRole && (
                        <Badge className={getRoleBadgeColor(userRole.role)}>
                          {getRoleLabel(userRole.role)}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Action Buttons - Connect/Message/More */}
                    <div className="flex justify-center sm:justify-end mt-2 sm:mt-0">
                      <ProfileActionButtons
                        targetUserId={userId!}
                        targetUserName={profile?.full_name}
                      />
                    </div>
                  </div>

                  {profile?.organization_name && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mb-2">
                      <Building2 className="h-4 w-4" />
                      <span>{profile.organization_name}</span>
                      {profile.organization_type && (
                        <Badge variant="outline" className="text-xs">
                          {profile.organization_type}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {format(new Date(profile?.created_at || new Date()), "MMM yyyy")}</span>
                    </div>
                    {profile?.website && (
                      <a
                        href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                  </div>

                  {profile?.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard
              icon={<Target className="h-5 w-5" />}
              label="Problems"
              value={stats?.problemsPosted || 0}
            />
            <StatCard
              icon={<Lightbulb className="h-5 w-5" />}
              label="Solutions"
              value={stats?.solutionsSubmitted || 0}
            />
            <StatCard
              icon={<CheckCircle className="h-5 w-5" />}
              label="Approved"
              value={stats?.solutionsApproved || 0}
            />
            <StatCard
              icon={<Heart className="h-5 w-5" />}
              label="Likes"
              value={stats?.likesReceived || 0}
            />
            <StatCard
              icon={<Briefcase className="h-5 w-5" />}
              label="Innovations"
              value={stats?.innovationsPublished || 0}
            />
            {user?.id === userId && stats?.investmentsMade > 0 && (
              <StatCard
                icon={<Briefcase className="h-5 w-5" />}
                label="Investments"
                value={stats?.investmentsMade || 0}
              />
            )}
          </div>

          {/* Activity Tabs */}
          <Tabs defaultValue="problems" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="problems">
                Problems ({problems.length})
              </TabsTrigger>
              <TabsTrigger value="solutions">
                Solutions ({solutions.length})
              </TabsTrigger>
              <TabsTrigger value="innovations">
                Innovations ({innovations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="problems">
              {problems.length > 0 ? (
                <div className="space-y-4">
              {problems.map((problem) => (
                    <ActivityCard
                      key={problem.id}
                      title={problem.title}
                      description={problem.description}
                      category={problem.category}
                      date={problem.created_at}
                      link={`/explore/${problem.id}`}
                      stats={
                        <>
                          <span>{(problem as any).like_count || 0} likes</span>
                          <span>{(problem as any).solutions_count || 0} solutions</span>
                        </>
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No problems posted yet" />
              )}
            </TabsContent>

            <TabsContent value="solutions">
              {solutions.length > 0 ? (
                <div className="space-y-4">
                  {solutions.map((solution) => (
                    <ActivityCard
                      key={solution.id}
                      title={solution.title}
                      description={solution.description}
                      subtitle={`For: ${solution.problem_title || "Unknown Problem"}`}
                      date={solution.created_at}
                      status={solution.status}
                      link={user ? `/dashboard/solutions/${solution.id}` : undefined}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No solutions submitted yet" />
              )}
            </TabsContent>

            <TabsContent value="innovations">
              {innovations.length > 0 ? (
                <div className="space-y-4">
                  {innovations.map((innovation) => (
                    <ActivityCard
                      key={innovation.id}
                      title={innovation.title}
                      description={innovation.tagline}
                      category={innovation.category}
                      date={innovation.created_at}
                      link={`/innovations`}
                      imageUrl={innovation.cover_image_url}
                      stats={
                        <>
                          <span>{(innovation as any).interest_count || 0} interests</span>
                          <span>{innovation.view_count || 0} views</span>
                        </>
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No innovations published yet" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-primary mb-2 flex justify-center">{icon}</div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// Activity Card Component
function ActivityCard({
  title,
  description,
  subtitle,
  category,
  date,
  status,
  link,
  imageUrl,
  stats,
}: {
  title: string;
  description: string;
  subtitle?: string;
  category?: string;
  date: string;
  status?: string;
  link?: string;
  imageUrl?: string;
  stats?: React.ReactNode;
}) {
  const content = (
    <Card className={link ? "hover:border-primary/50 transition-colors cursor-pointer" : ""}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {imageUrl && (
            <div className="hidden sm:block flex-shrink-0">
              <img
                src={imageUrl}
                alt={title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold line-clamp-1">{title}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {category && (
                  <Badge variant="outline" className="text-xs">
                    {category}
                  </Badge>
                )}
                {status && (
                  <Badge
                    variant="outline"
                    className={
                      status === "accepted"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "text-xs"
                    }
                  >
                    {status}
                  </Badge>
                )}
              </div>
            </div>
            {subtitle && (
              <p className="text-xs text-primary mb-1">{subtitle}</p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{format(new Date(date), "MMM d, yyyy")}</span>
              {stats}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// Skeleton Loading Component
function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PublicProfile;
