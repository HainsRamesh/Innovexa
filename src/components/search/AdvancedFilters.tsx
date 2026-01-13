import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export interface FilterValues {
  industry?: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  timelineWeeks?: number;
  tags?: string[];
  status?: string;
}

interface AdvancedFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  type: 'problems' | 'innovations' | 'solutions';
}

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Agriculture",
  "Energy",
  "Transportation",
  "Real Estate",
];

const PROBLEM_CATEGORIES = [
  "technology",
  "healthcare",
  "sustainability",
  "finance",
  "education",
  "infrastructure",
  "manufacturing",
  "agriculture",
  "other",
];

const INNOVATION_CATEGORIES = [
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

const STATUS_OPTIONS = {
  problems: [
    { value: "open", label: "Open" },
    { value: "in_review", label: "In Review" },
    { value: "matched", label: "Matched" },
    { value: "closed", label: "Closed" },
  ],
  innovations: [
    { value: "published", label: "Live" },
    { value: "featured", label: "Featured" },
  ],
  solutions: [
    { value: "submitted", label: "Submitted" },
    { value: "under_review", label: "Under Review" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "accepted", label: "Accepted" },
  ],
};

export const AdvancedFilters = ({
  filters,
  onFiltersChange,
  type,
}: AdvancedFiltersProps) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);
  const [tagInput, setTagInput] = useState("");

  const categories = type === 'innovations' ? INNOVATION_CATEGORIES : PROBLEM_CATEGORIES;
  const statusOptions = STATUS_OPTIONS[type] || [];

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: FilterValues = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const addTag = () => {
    if (tagInput.trim() && !localFilters.tags?.includes(tagInput.trim())) {
      setLocalFilters({
        ...localFilters,
        tags: [...(localFilters.tags || []), tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setLocalFilters({
      ...localFilters,
      tags: localFilters.tags?.filter(t => t !== tag),
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => 
    v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Refine your search with advanced criteria
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Industry */}
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select
              value={localFilters.industry || ""}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, industry: value || undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All industries</SelectItem>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry.toLowerCase()}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={localFilters.category || ""}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, category: value || undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          {statusOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={localFilters.status || ""}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, status: value || undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Budget Range - Only for problems */}
          {type === 'problems' && (
            <div className="space-y-4">
              <Label>Budget Range ($)</Label>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={localFilters.budgetMin || ""}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        budgetMin: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    placeholder="1,000,000"
                    value={localFilters.budgetMax || ""}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        budgetMax: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Timeline - Only for solutions */}
          {type === 'solutions' && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Max Timeline (weeks)</Label>
                <span className="text-sm text-muted-foreground">
                  {localFilters.timelineWeeks || 52} weeks
                </span>
              </div>
              <Slider
                value={[localFilters.timelineWeeks || 52]}
                onValueChange={([value]) =>
                  setLocalFilters({ ...localFilters, timelineWeeks: value })
                }
                min={1}
                max={52}
                step={1}
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} variant="secondary">
                Add
              </Button>
            </div>
            {localFilters.tags && localFilters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {localFilters.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
