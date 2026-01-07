import { useEffect, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Problem, ProblemCategory, ProblemStatus } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

const categories: ProblemCategory[] = [
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

const statuses: ProblemStatus[] = ["draft", "open", "in_review", "matched", "closed"];

export default function EditProblemPage() {
  const { problemId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation = location.state?.from;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProblemCategory>("other");
  const [status, setStatus] = useState<ProblemStatus>("draft");
  const [industry, setIndustry] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [requirementsInput, setRequirementsInput] = useState("");

  useEffect(() => {
    if (!problemId) {
      setIsLoading(false);
      return;
    }

    const fetchProblem = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("id", problemId)
        .maybeSingle();

      if (error || !data) {
        toast({
          title: "Could not load problem",
          description: "Please try again later.",
          variant: "destructive",
        });
        navigate("/dashboard/problems");
        return;
      }

      const problem = data as Problem;

      if (user && problem.owner_id !== user.id) {
        toast({
          title: "Access denied",
          description: "You can only edit your own problems.",
          variant: "destructive",
        });
        navigate("/dashboard/problems");
        return;
      }

      setTitle(problem.title);
      setDescription(problem.description);
      setCategory(problem.category);
      setStatus(problem.status);
      setIndustry(problem.industry ?? "");
      setBudgetMin(problem.budget_min?.toString() ?? "");
      setBudgetMax(problem.budget_max?.toString() ?? "");
      setDeadline(problem.deadline ? problem.deadline.split("T")[0] : "");
      setTagsInput(problem.tags?.join(", ") ?? "");
      setRequirementsInput(problem.requirements?.join("\n") ?? "");

      setIsLoading(false);
    };

    fetchProblem();
  }, [problemId, user, toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast({
        title: "Validation error",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const requirements = requirementsInput
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("problems")
      .update({
        title: title.trim(),
        description: description.trim(),
        category,
        status,
        industry: industry.trim() || null,
        budget_min: budgetMin ? parseFloat(budgetMin) : null,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
        deadline: deadline || null,
        tags: tags.length > 0 ? tags : null,
        requirements: requirements.length > 0 ? requirements : null,
      })
      .eq("id", problemId);

    setIsSaving(false);

    if (error) {
      console.error("Error updating problem:", error);
      toast({
        title: "Error",
        description: "Failed to update problem.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Problem updated" });
      if (fromLocation === 'overview') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard/browse');
      }
    }
  };

  const handleBack = () => {
    if (fromLocation === 'overview') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard/browse');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Problem</CardTitle>
          <CardDescription>Update the details of your problem.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter problem title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the problem in detail"
                rows={5}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ProblemCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProblemStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ").charAt(0).toUpperCase() + s.replace("_", " ").slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., FinTech, Biotech"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Budget Min ($)</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">Budget Max ($)</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="AI, Blockchain, IoT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements (one per line)</Label>
              <Textarea
                id="requirements"
                value={requirementsInput}
                onChange={(e) => setRequirementsInput(e.target.value)}
                placeholder="Must support 10k concurrent users&#10;Integration with existing ERP"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
