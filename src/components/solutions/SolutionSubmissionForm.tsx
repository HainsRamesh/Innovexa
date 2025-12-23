import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Paperclip, X } from "lucide-react";

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
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: "Estimated cost must be a positive number",
    }),
  timeline_weeks: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 1 && val <= 520), {
      message: "Timeline must be between 1 and 520 weeks",
    }),
  technology_stack: z.string().optional(),
});

type SolutionFormInput = z.input<typeof solutionSchema>;
type SolutionFormValues = z.output<typeof solutionSchema>;

interface SolutionSubmissionFormProps {
  problemId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SolutionSubmissionForm({
  problemId,
  onSuccess,
  onCancel,
}: SolutionSubmissionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const form = useForm<z.input<typeof solutionSchema>>({
    resolver: zodResolver(solutionSchema),
    defaultValues: {
      title: "",
      description: "",
      approach: "",
      estimated_cost: "",
      timeline_weeks: "",
      technology_stack: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 5 - attachments.length);
      setAttachments((prev) => [...prev, ...newFiles].slice(0, 5));
    }
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SolutionFormInput) => {
    setIsSubmitting(true);

    try {
      // Parse and transform the input data
      const values = solutionSchema.parse(data);
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to submit a solution.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const technologyStack = values.technology_stack
        ? values.technology_stack.split(",").map((t) => t.trim()).filter(Boolean)
        : null;

      const { error } = await supabase.from("solutions").insert({
        problem_id: problemId,
        innovator_id: user.id,
        title: values.title,
        description: values.description,
        approach: values.approach || null,
        estimated_cost: values.estimated_cost ?? null,
        timeline_weeks: values.timeline_weeks ?? null,
        technology_stack: technologyStack,
        status: "submitted",
      });

      if (error) {
        console.error("Error submitting solution:", error);
        toast({
          title: "Submission failed",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Solution submitted!",
        description: "Your solution has been submitted for review.",
      });

      form.reset();
      setAttachments([]);
      onSuccess?.();
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Submit Your Solution
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

            {/* File Attachments */}
            <div className="space-y-3">
              <FormLabel>Attachments (optional)</FormLabel>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={attachments.length >= 5}
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
                  {attachments.length}/5 files
                </span>
              </div>

              {attachments.length > 0 && (
                <ul className="space-y-2">
                  {attachments.map((file, index) => (
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
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                Supported: PDF, DOC, DOCX, TXT, PNG, JPG (max 5 files). File upload coming soon.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Solution
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
