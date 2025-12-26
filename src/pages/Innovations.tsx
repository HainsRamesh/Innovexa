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
import { Innovation, InnovationCategory } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Sparkles, Loader2 } from "lucide-react";
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
  const { role } = useAuth();
  const [selectedInnovation, setSelectedInnovation] = useState<Innovation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const isInnovator = role === "innovator";

  const { data: innovations = [], isLoading } = useQuery({
    queryKey: ["innovations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("innovations")
        .select("*")
        .in("status", ["published", "featured"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Innovation[];
    },
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

  // Featured innovations (first 5)
  const featuredInnovations = innovations.filter((i) => i.status === "featured").slice(0, 5);
  const hasFeatured = featuredInnovations.length > 0;

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
