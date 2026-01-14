import { useEffect, useState } from "react";
import { Search, Filter, Clock, User, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
  created_at: string;
  user_name?: string;
}

const ACTION_TYPES = [
  "login",
  "logout",
  "profile_update",
  "problem_create",
  "problem_update",
  "problem_delete",
  "solution_create",
  "solution_update",
  "innovation_create",
  "innovation_update",
  "message_send",
  "admin_action",
];

export const AuditLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  const fetchLogs = async (reset = false) => {
    const currentPage = reset ? 0 : page;
    setIsLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (searchQuery) {
        query = query.ilike("action", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (reset) {
        setLogs(data || []);
        setPage(0);
      } else {
        setLogs(prev => [...prev, ...(data || [])]);
      }
      setHasMore((data?.length || 0) === pageSize);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [actionFilter, searchQuery]);

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      login: "bg-green-500/10 text-green-600",
      logout: "bg-gray-500/10 text-gray-600",
      create: "bg-blue-500/10 text-blue-600",
      update: "bg-yellow-500/10 text-yellow-600",
      delete: "bg-red-500/10 text-red-600",
      admin: "bg-purple-500/10 text-purple-600",
    };

    const color = Object.entries(colors).find(([key]) => action.includes(key))?.[1] || "";
    
    return (
      <Badge variant="secondary" className={color}>
        {action.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {ACTION_TYPES.map((action) => (
              <SelectItem key={action} value={action}>
                {action.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && logs.length === 0 ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No audit logs found</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                    </div>
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    {log.entity_type && (
                      <Badge variant="outline" className="capitalize">
                        {log.entity_type}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata as object).length > 0 ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {JSON.stringify(log.metadata).slice(0, 100)}
                        {JSON.stringify(log.metadata).length > 100 && "..."}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => {
            setPage(p => p + 1);
            fetchLogs();
          }}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};
