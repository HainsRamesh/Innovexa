import { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  MessageSquare,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface ContentReport {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reporter_name?: string;
}

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_user_name?: string;
}

export const ContentModeration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contentReports, setContentReports] = useState<ContentReport[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("content");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolution, setResolution] = useState<"resolved" | "dismissed">("resolved");

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        // Fetch content reports
        const { data: content, error: contentError } = await supabase
          .from("content_reports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (contentError) throw contentError;

        // Fetch user reports
        const { data: users, error: usersError } = await supabase
          .from("user_reports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (usersError) throw usersError;

        setContentReports(content || []);
        setUserReports(users || []);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast({
          title: "Error",
          description: "Failed to fetch reports",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [toast]);

  const handleResolve = async () => {
    if (!selectedReport || !user) return;

    try {
      const { error } = await supabase
        .from("content_reports")
        .update({
          status: resolution,
          admin_notes: adminNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedReport.id);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: resolution === "resolved" ? "remove_content" : "dismiss",
        target_content_type: selectedReport.content_type,
        target_content_id: selectedReport.content_id,
        notes: adminNotes,
      });

      toast({
        title: "Report Updated",
        description: `Report has been marked as ${resolution}.`,
      });

      setContentReports(contentReports.map(r => 
        r.id === selectedReport.id ? { ...r, status: resolution, admin_notes: adminNotes } : r
      ));
    } catch (error) {
      console.error("Error resolving report:", error);
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive",
      });
    } finally {
      setResolveDialogOpen(false);
      setSelectedReport(null);
      setAdminNotes("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
      case 'reviewed':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Reviewed</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getContentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      problem: "bg-orange-500/10 text-orange-600",
      solution: "bg-purple-500/10 text-purple-600",
      innovation: "bg-blue-500/10 text-blue-600",
      message: "bg-pink-500/10 text-pink-600",
    };
    return (
      <Badge variant="secondary" className={colors[type] || ""}>
        {type}
      </Badge>
    );
  };

  const pendingContentCount = contentReports.filter(r => r.status === 'pending').length;
  const pendingUserCount = userReports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="content" className="gap-2">
            Content Reports
            {pendingContentCount > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingContentCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            User Reports
            {pendingUserCount > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingUserCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : contentReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No content reports</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  contentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{getContentTypeBadge(report.content_type)}</TableCell>
                      <TableCell>
                        <p className="font-medium">{report.reason}</p>
                        {report.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {report.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(report.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Content
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {report.status === 'pending' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setResolution("resolved");
                                    setResolveDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Resolve (Remove Content)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setResolution("dismissed");
                                    setResolveDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Dismiss Report
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reported User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : userReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No user reports</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  userReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.reported_user_name || "Unknown User"}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{report.reason}</p>
                        {report.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {report.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(report.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolution === "resolved" ? "Resolve Report" : "Dismiss Report"}
            </DialogTitle>
            <DialogDescription>
              {resolution === "resolved" 
                ? "This will remove the reported content and notify the user."
                : "This will dismiss the report without taking action."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={resolution === "resolved" ? "destructive" : "default"}
              onClick={handleResolve}
            >
              {resolution === "resolved" ? "Resolve & Remove" : "Dismiss"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
