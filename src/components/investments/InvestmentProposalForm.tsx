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
import type { Solution } from "@/types";
import { Loader2, TrendingUp, X } from "lucide-react";

interface InvestmentProposalFormProps {
  problemId: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  selectedSolution?: Solution | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InvestmentProposalForm({
  problemId,
  budgetMin,
  budgetMax,
  selectedSolution,
  onSuccess,
  onCancel,
}: InvestmentProposalFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const investmentSchema = z.object({
    funding_amount: z
      .string()
      .min(1, "Funding amount is required")
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Funding amount must be a positive number",
      })
      .refine(
        (val) => {
          if (budgetMin !== null && budgetMin !== undefined && val < budgetMin) {
            return false;
          }
          return true;
        },
        { message: `Funding must be at least $${budgetMin?.toLocaleString()}` }
      )
      .refine(
        (val) => {
          if (budgetMax !== null && budgetMax !== undefined && val > budgetMax) {
            return false;
          }
          return true;
        },
        { message: `Funding cannot exceed $${budgetMax?.toLocaleString()}` }
      ),
    expected_roi: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: "Expected ROI must be a positive number",
      }),
    conditions: z
      .string()
      .trim()
      .max(2000, "Conditions must be less than 2000 characters")
      .optional(),
    comments: z
      .string()
      .trim()
      .max(2000, "Comments must be less than 2000 characters")
      .optional(),
  });

  type InvestmentFormValues = z.output<typeof investmentSchema>;

  const form = useForm<z.input<typeof investmentSchema>>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      funding_amount: "",
      expected_roi: "",
      conditions: "",
      comments: "",
    },
  });

  const onSubmit = async (values: InvestmentFormValues) => {
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to submit an investment proposal.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("investments").insert({
        investor_id: user.id,
        problem_id: problemId,
        solution_id: selectedSolution?.id || null,
        funding_amount: values.funding_amount,
        expected_roi: values.expected_roi ?? null,
        conditions: values.conditions || null,
        comments: values.comments || null,
        status: "proposed",
      });

      if (error) {
        console.error("Error submitting investment:", error);
        toast({
          title: "Submission failed",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Investment proposal submitted!",
        description: "Your proposal has been sent for review.",
      });

      form.reset();
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

  const budgetHint =
    budgetMin && budgetMax
      ? `Budget range: $${budgetMin.toLocaleString()} - $${budgetMax.toLocaleString()}`
      : budgetMax
      ? `Up to $${budgetMax.toLocaleString()}`
      : budgetMin
      ? `From $${budgetMin.toLocaleString()}`
      : "Open budget";

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Propose Investment
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {selectedSolution && (
          <p className="text-sm text-muted-foreground mt-2">
            Investing in solution: <strong>{selectedSolution.title}</strong>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              onSubmit(investmentSchema.parse(data))
            )}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="funding_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Amount ($) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="50000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{budgetHint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_roi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected ROI (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="15"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Your expected return on investment percentage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any conditions or requirements for your investment..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Specify any terms or conditions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes or comments..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Submit Proposal
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
