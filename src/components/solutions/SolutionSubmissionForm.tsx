import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AttachmentsList } from "./AttachmentsList";
import { SubmissionLoadingOverlay, SubmissionStatus } from "@/components/ui/SubmissionLoadingOverlay";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Paperclip, X, Edit, Loader2 } from "lucide-react";

const solutionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title must be less than 150 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be less than 5000 characters"),
  approach: z
    .string()
    .trim()
    .max(3000, "Technical approach must be less than 3000 characters")
    .optional(),
  estimated_cost: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Estimated cost must be a positive number",
    }),
  timeline_weeks: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 1 && parseInt(val, 10) <= 520), {
      message: "Timeline must be between 1 and 520 weeks",
    }),
  technology_stack: z.string().optional(),
});

type SolutionFormValues = z.infer<typeof solutionSchema>;

interface ExistingSolution {
  id: string;
  title: string;
  description: string;
  approach: string | null;
  estimated_cost: number | null;
  timeline_weeks: number | null;
  technology_stack: string[] | null;
  attachments?: string[] | null;
  innovator_id?: string;
}

interface SolutionSubmissionFormProps {
  problemId: string;
  existingSolution?: ExistingSolution | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SolutionSubmissionForm({
  problemId,
  existingSolution,
  onSuccess,
  onCancel,
}: SolutionSubmissionFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("loading");
  const [lastError, setLastError] = useState<string | undefined>();
  const [pendingValues, setPendingValues] = useState<SolutionFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);

  const isEditing = !!existingSolution;

  const form = useForm<SolutionFormValues>({
    resolver: zodResolver(solutionSchema),
    defaultValues: {
      title: existingSolution?.title || "",
      description: existingSolution?.description || "",
      approach: existingSolution?.approach || "",
      estimated_cost: existingSolution?.estimated_cost?.toString() || "",
      timeline_weeks: existingSolution?.timeline_weeks?.toString() || "",
      technology_stack: existingSolution?.technology_stack?.join(", ") || "",
    },
  });

  // Reset form when existingSolution changes
  useEffect(() => {
    if (existingSolution) {
      form.reset({
        title: existingSolution.title,
        description: existingSolution.description,
        approach: existingSolution.approach || "",
        estimated_cost: existingSolution.estimated_cost?.toString() || "",
        timeline_weeks: existingSolution.timeline_weeks?.toString() || "",
        technology_stack: existingSolution.technology_stack?.join(", ") || "",
      });
    }
  }, [existingSolution, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const existingCount = existingSolution?.attachments?.length || 0;
      const maxNew = 5 - existingCount - newAttachments.length;
      const newFiles = Array.from(files).slice(0, maxNew);
      setNewAttachments((prev) => [...prev, ...newFiles].slice(0, 5 - existingCount));
    }
    e.target.value = "";
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (userId: string, solutionId: string): Promise<string[]> => {
    if (newAttachments.length === 0) return [];

    const uploadedPaths: string[] = [];

    for (const file of newAttachments) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${solutionId}/${fileName}`;

      const { error } = await supabase.storage
        .from("solution-attachments")
        .upload(filePath, file);

      if (error) {
        console.error("Error uploading file:", error);
        throw new Error(`Failed to upload ${file.name}`);
      }

      uploadedPaths.push(filePath);
    }

    return uploadedPaths;
  };

  const performSubmission = useCallback(async (values: SolutionFormValues) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Please sign in to submit a solution.");
      }

      const technologyStack = values.technology_stack
        ? values.technology_stack.split(",").map((t) => t.trim()).filter(Boolean)
        : null;

      const estimatedCost = values.estimated_cost ? parseFloat(values.estimated_cost) : null;
      const timelineWeeks = values.timeline_weeks ? parseInt(values.timeline_weeks, 10) : null;

      if (isEditing && existingSolution) {
        // Upload new attachments if any
        let allAttachments = existingSolution.attachments || [];
        if (newAttachments.length > 0) {
          setIsUploading(true);
          const newPaths = await uploadAttachments(user.id, existingSolution.id);
          allAttachments = [...allAttachments, ...newPaths];
          setIsUploading(false);
        }

        // Update existing solution
        const { error } = await supabase
          .from("solutions")
          .update({
            title: values.title!,
            description: values.description!,
            approach: values.approach || null,
            estimated_cost: estimatedCost,
            timeline_weeks: timelineWeeks,
            technology_stack: technologyStack,
            attachments: allAttachments.length > 0 ? allAttachments : null,
          })
          .eq("id", existingSolution.id);

        if (error) {
          throw new Error(error.message || "Failed to update solution.");
        }
      } else {
        // Create new solution first to get the ID
        const { data: newSolution, error: insertError } = await supabase
          .from("solutions")
          .insert({
            problem_id: problemId,
            innovator_id: user.id,
            title: values.title!,
            description: values.description!,
            approach: values.approach || null,
            estimated_cost: estimatedCost,
            timeline_weeks: timelineWeeks,
            technology_stack: technologyStack,
            status: "submitted" as const,
          })
          .select("id")
          .single();

        if (insertError) {
          throw new Error(insertError.message || "Failed to submit solution.");
        }

        // Upload attachments if any
        if (newAttachments.length > 0 && newSolution) {
          setIsUploading(true);
          const uploadedPaths = await uploadAttachments(user.id, newSolution.id);
          
          // Update solution with attachment paths
          await supabase
            .from("solutions")
            .update({ attachments: uploadedPaths })
            .eq("id", newSolution.id);

          setIsUploading(false);
        }
      }

      // Success
      setSubmissionStatus("success");
      form.reset();
      setNewAttachments([]);
      
      // Wait for success animation then navigate/callback
      setTimeout(() => {
        setOverlayOpen(false);
        setIsSubmitting(false);
        toast({
          title: isEditing ? "Solution updated!" : "Solution submitted!",
          description: isEditing 
            ? "Your solution has been updated successfully."
            : "Your solution has been submitted for review.",
        });
        onSuccess?.();
      }, 600);
    } catch (err) {
      console.error("Submission error:", err);
      setLastError(err instanceof Error ? err.message : "Please try again later.");
      setSubmissionStatus("error");
      setIsUploading(false);
    }
  }, [isEditing, existingSolution, newAttachments, problemId, form, toast, onSuccess]);

  const onSubmit = async (values: SolutionFormValues) => {
    setPendingValues(values);
    setIsSubmitting(true);
    setOverlayOpen(true);
    setSubmissionStatus("loading");
    setLastError(undefined);
    
    // Perform the actual submission
    await performSubmission(values);
  };

  const handleRetry = useCallback(() => {
    if (pendingValues) {
      setSubmissionStatus("loading");
      performSubmission(pendingValues);
    }
  }, [pendingValues, performSubmission]);

  const handleCloseOverlay = useCallback(() => {
    setOverlayOpen(false);
    setIsSubmitting(false);
    setPendingValues(null);
  }, []);

  const existingCount = existingSolution?.attachments?.length || 0;
  const totalCount = existingCount + newAttachments.length;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Edit className="h-5 w-5" />
              Edit Your Solution
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Submit Your Solution
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solution Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="A concise title for your solution"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your solution in detail. What problem does it solve and how?"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain the core idea and benefits of your solution.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="approach"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technical Approach</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the technical implementation, architecture, or methodology..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Detail the technical aspects of your solution.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technology_stack"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technology Stack</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="React, Node.js, PostgreSQL, AWS..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated list of technologies you'd use.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="estimated_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="10000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeline_weeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeline (weeks)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="520"
                        placeholder="12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Existing Attachments (Edit mode) */}
            {isEditing && existingSolution?.attachments && existingSolution.attachments.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Existing Attachments</FormLabel>
                <AttachmentsList
                  attachments={existingSolution.attachments}
                  innovatorId={existingSolution.innovator_id || ""}
                  showCard={false}
                />
              </div>
            )}

            {/* New File Attachments */}
            <div className="space-y-3">
              <FormLabel>{isEditing ? "Add More Attachments" : "Attachments (optional)"}</FormLabel>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={totalCount >= 5 || isUploading}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add File
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
                <span className="text-sm text-muted-foreground">
                  {totalCount}/5 files
                </span>
              </div>

              {newAttachments.length > 0 && (
                <ul className="space-y-2">
                  {newAttachments.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-secondary/50 rounded-md px-3 py-2 text-sm"
                    >
                      <span className="truncate max-w-[250px]">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeNewAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                Supported: PDF, DOC, DOCX, TXT, PNG, JPG (max 5 files total)
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting || isUploading} className="flex-1 sm:flex-none">
                {isSubmitting || isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isEditing ? (
                  <Edit className="h-4 w-4 mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Uploading files…" : isEditing ? "Update Solution" : "Submit Solution"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      {/* Submission Loading Overlay */}
      <SubmissionLoadingOverlay
        open={overlayOpen}
        type="solution"
        status={submissionStatus}
        onRetry={handleRetry}
        onClose={handleCloseOverlay}
        errorMessage={lastError}
      />
    </Card>
  );
}
