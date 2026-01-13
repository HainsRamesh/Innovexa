import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InnovationCategoryRow } from "@/components/innovations/InnovationCategoryRow";
import { InnovationDetailModal } from "@/components/innovations/InnovationDetailModal";
import { MyInnovationsSection } from "@/components/innovations/MyInnovationsSection";
import { Innovation, InnovationCategory } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories: InnovationCategory[] = [
  "ai",
  "healthtech",
  "fintech",
  "climatetech",
  "edtech",
  "saas",
  "hardware",
  "web3",
  "other",
];

const categoryLabels: Record<InnovationCategory, string> = {
  ai: "AI",
  healthtech: "HealthTech",
  fintech: "FinTech",
  climatetech: "ClimateTech",
  edtech: "EdTech",
  saas: "SaaS",
  hardware: "Hardware",
  web3: "Web3",
  other: "Other",
};

export default function Innovations() {
  const { user, role } = useAuth();
  const [selectedInnovation, setSelectedInnovation] = useState<Innovation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const isInnovator = role === "innovator";

  // Fetch all published/featured innovations with creator profiles
  const { data: innovations = [], isLoading } = useQuery({
    queryKey: ["innovations"],
    queryFn: async () => {
      // First fetch innovations
      const { data: innovationsData, error: innovationsError } = await supabase
        .from("innovations")
        .select("*")
        .in("status", ["published", "featured"])
        .order("created_at", { ascending: false });

      if (innovationsError) throw innovationsError;
      
      // Get unique innovator IDs
      const innovatorIds = [...new Set(innovationsData.map(i => i.innovator_id))];
      
      // Fetch profiles for these innovators
      const { data: profilesData, error: profilesError } = await supabase
        .from("public_profiles")
        .select("id, full_name, avatar_url, organization_name")
        .in("id", innovatorIds);
        
      if (profilesError) throw profilesError;
      
      // Create a map for quick lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) ?? []);
      
      // Attach profiles to innovations
      const innovationsWithProfiles = innovationsData.map(innovation => ({
        ...innovation,
        profiles: profilesMap.get(innovation.innovator_id) || null,
      }));
      
      return innovationsWithProfiles as Innovation[];
    },
  });

  // Fetch innovator's own innovations (all statuses) with creator profiles
  const { data: myInnovations = [], refetch: refetchMyInnovations } = useQuery({
    queryKey: ["my-innovations", user?.id],
    queryFn: async () => {
      if (!user || !isInnovator) return [];
      
      // Fetch innovations
      const { data: innovationsData, error: innovationsError } = await supabase
        .from("innovations")
        .select("*")
        .eq("innovator_id", user.id)
        .order("created_at", { ascending: false });

      if (innovationsError) throw innovationsError;
      
      // Fetch user's profile
      const { data: profileData, error: profileError } = await supabase
        .from("public_profiles")
        .select("id, full_name, avatar_url, organization_name")
        .eq("id", user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      // Attach profile to all innovations
      const innovationsWithProfiles = innovationsData.map(innovation => ({
        ...innovation,
        profiles: profileData || null,
      }));
      
      return innovationsWithProfiles as Innovation[];
    },
    enabled: !!user && isInnovator,
  });

  const filteredInnovations = useMemo(() => {
    let filtered = innovations;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.tagline.toLowerCase().includes(query) ||
          i.category.toLowerCase().includes(query),
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((i) => i.category === categoryFilter);
    }

    return filtered;
  }, [innovations, searchQuery, categoryFilter]);

  const innovationsByCategory = useMemo(() => {
    const grouped: Record<InnovationCategory, Innovation[]> = {
      ai: [],
      healthtech: [],
      fintech: [],
      climatetech: [],
      edtech: [],
      saas: [],
      hardware: [],
      web3: [],
      other: [],
    };

    filteredInnovations.forEach((innovation) => {
      grouped[innovation.category].push(innovation);
    });

    return grouped;
  }, [filteredInnovations]);

  const handleSelectInnovation = (innovation: Innovation) => {
    setSelectedInnovation(innovation);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Search Section */}
      <section className="pt-24 pb-12 bg-background">
        <div className="container mx-auto px-4">
          {/* Search & Filter Bar */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search innovations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isInnovator && (
              <Button asChild className="gap-2">
                <Link to="/innovations/new">
                  <Plus className="h-4 w-4" />
                  Add Innovation
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Innovations Listing */}
      <section className="py-8 pb-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInnovations.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">No innovations found</p>
              {isInnovator && (
                <Button asChild>
                  <Link to="/innovations/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Innovation
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {/* My Innovations Section - Only for innovators with innovations */}
              {isInnovator && myInnovations.length > 0 && (
                <MyInnovationsSection
                  innovations={myInnovations}
                  onSelectInnovation={handleSelectInnovation}
                  onRefresh={() => refetchMyInnovations()}
                />
              )}

              {/* Show by category if no specific filter */}
              {categoryFilter === "all" ? (
                categories.map((category) => (
                  <InnovationCategoryRow
                    key={category}
                    category={category}
                    innovations={innovationsByCategory[category]}
                    onSelectInnovation={handleSelectInnovation}
                  />
                ))
              ) : (
                <InnovationCategoryRow
                  category={categoryFilter as InnovationCategory}
                  innovations={filteredInnovations}
                  onSelectInnovation={handleSelectInnovation}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      <InnovationDetailModal innovation={selectedInnovation} open={modalOpen} onOpenChange={setModalOpen} />

      <Footer />
    </div>
  );
}
