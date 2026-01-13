import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2, Lightbulb, FileText, User, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'problem' | 'innovation' | 'solution' | 'profile';
  title: string;
  subtitle?: string;
  category?: string;
  avatar_url?: string;
}

interface GlobalSearchProps {
  className?: string;
}

export const GlobalSearch = ({ className }: GlobalSearchProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchTerm = `%${searchQuery}%`;

      // Search problems
      const { data: problems } = await supabase
        .from("problems")
        .select("id, title, category, status")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .neq("status", "draft")
        .limit(5);

      // Search innovations
      const { data: innovations } = await supabase
        .from("innovations")
        .select("id, title, tagline, category, status")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},tagline.ilike.${searchTerm}`)
        .in("status", ["published", "featured"])
        .limit(5);

      // Search solutions
      const { data: solutions } = await supabase
        .from("solutions")
        .select("id, title, description, status")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      // Search profiles
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, full_name, organization_name, avatar_url")
        .or(`full_name.ilike.${searchTerm},organization_name.ilike.${searchTerm}`)
        .limit(5);

      const allResults: SearchResult[] = [
        ...(problems?.map(p => ({
          id: p.id,
          type: 'problem' as const,
          title: p.title,
          subtitle: p.status,
          category: p.category,
        })) || []),
        ...(innovations?.map(i => ({
          id: i.id,
          type: 'innovation' as const,
          title: i.title,
          subtitle: i.tagline,
          category: i.category,
        })) || []),
        ...(solutions?.map(s => ({
          id: s.id,
          type: 'solution' as const,
          title: s.title,
          subtitle: s.description?.slice(0, 60) + "...",
        })) || []),
        ...(profiles?.map(p => ({
          id: p.id,
          type: 'profile' as const,
          title: p.full_name || 'Unknown',
          subtitle: p.organization_name,
          avatar_url: p.avatar_url,
        })) || []),
      ];

      setResults(allResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    switch (result.type) {
      case 'problem':
        navigate(`/explore/${result.id}`);
        break;
      case 'innovation':
        navigate(`/innovations`);
        break;
      case 'solution':
        navigate(`/solutions`);
        break;
      case 'profile':
        navigate(`/users/${result.id}`);
        break;
    }
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'problem':
        return <FileText className="h-4 w-4" />;
      case 'innovation':
        return <Lightbulb className="h-4 w-4" />;
      case 'solution':
        return <Briefcase className="h-4 w-4" />;
      case 'profile':
        return <User className="h-4 w-4" />;
    }
  };

  const filteredResults = activeTab === "all" 
    ? results 
    : results.filter(r => r.type === activeTab);

  const resultCounts = {
    all: results.length,
    problem: results.filter(r => r.type === 'problem').length,
    innovation: results.filter(r => r.type === 'innovation').length,
    solution: results.filter(r => r.type === 'solution').length,
    profile: results.filter(r => r.type === 'profile').length,
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-9 md:w-64 md:justify-start md:px-3 md:py-2",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline-flex text-muted-foreground">
          Search...
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search problems, innovations, solutions, users..."
                className="pl-10 pr-10"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          {query.length >= 2 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
              <TabsList className="w-full justify-start h-9 bg-transparent border-b rounded-none">
                <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  All ({resultCounts.all})
                </TabsTrigger>
                <TabsTrigger value="problem" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Problems ({resultCounts.problem})
                </TabsTrigger>
                <TabsTrigger value="innovation" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Innovations ({resultCounts.innovation})
                </TabsTrigger>
                <TabsTrigger value="solution" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Solutions ({resultCounts.solution})
                </TabsTrigger>
                <TabsTrigger value="profile" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Users ({resultCounts.profile})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="max-h-[400px] overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : query.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to search...</p>
                <p className="text-sm mt-1">Search across problems, innovations, solutions, and users</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors"
                  >
                    {result.type === 'profile' && result.avatar_url ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.avatar_url} />
                        <AvatarFallback>{result.title[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {getIcon(result.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0">
                      {result.type}
                    </Badge>
                    {result.category && (
                      <Badge variant="secondary" className="capitalize shrink-0">
                        {result.category}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
