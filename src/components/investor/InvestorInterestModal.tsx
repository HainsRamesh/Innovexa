import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, MessageCircle, Rocket, DollarSign } from "lucide-react";

const interestSchema = z.object({
  investor_name: z.string().min(1, "Name is required"),
  interest_type: z.enum(["discussion", "pilot", "funding"], {
    required_error: "Please select your type of interest",
  }),
  investment_range: z.string().optional(),
  message: z.string().max(1000, "Message must be less than 1000 characters").optional(),
});

type InterestFormValues = z.infer<typeof interestSchema>;

interface InvestorInterestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "problem" | "innovation";
  targetId: string;
  targetTitle: string;
  onSuccess?: () => void;
}

const investmentRanges = [
  { value: "under_10k", label: "Under $10,000" },
  { value: "10k_50k", label: "$10,000 - $50,000" },
  { value: "50k_100k", label: "$50,000 - $100,000" },
  { value: "100k_500k", label: "$100,000 - $500,000" },
  { value: "500k_1m", label: "$500,000 - $1,000,000" },
  { value: "over_1m", label: "Over $1,000,000" },
];

const interestTypeIcons = {
  discussion: MessageCircle,
  pilot: Rocket,
  funding: DollarSign,
};

export function InvestorInterestModal({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetTitle,
  onSuccess,
}: InvestorInterestModalProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InterestFormValues>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      investor_name: profile?.full_name || "",
      interest_type: undefined,
      investment_range: "",
      message: "",
    },
  });

  // Update investor_name when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      form.setValue("investor_name", profile.full_name);
    }
  }, [profile, form]);

  const watchInterestType = form.watch("interest_type");

  const onSubmit = async (values: InterestFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to express interest.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const insertData = {
        investor_id: user.id,
        investor_name: values.investor_name,
        interest_type: values.interest_type,
        investment_range: values.investment_range || null,
        message: values.message || null,
        ...(targetType === "problem" 
          ? { problem_id: targetId }
          : { innovation_id: targetId }
        ),
      };

      const { error } = await supabase
        .from("investor_interests")
        .insert(insertData);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already interested",
            description: "You have already expressed interest in this item.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Interest submitted!",
        description: "The innovator and enterprise have been notified of your interest.",
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting interest:", error);
      toast({
        title: "Submission failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ready to Invest
          </DialogTitle>
          <DialogDescription>
            Express your interest in: <strong className="text-foreground">{targetTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="investor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interest_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Interest *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-3"
                    >
                      {[
                        { value: "discussion", label: "Discussion", desc: "I'd like to learn more" },
                        { value: "pilot", label: "Pilot / POC", desc: "Ready for a proof of concept" },
                        { value: "funding", label: "Funding", desc: "Ready to invest directly" },
                      ].map((option) => {
                        const Icon = interestTypeIcons[option.value as keyof typeof interestTypeIcons];
                        return (
                          <div key={option.value} className="flex items-center space-x-3">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label 
                              htmlFor={option.value} 
                              className="flex items-center gap-3 cursor-pointer flex-1 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <Icon className="h-4 w-4 text-primary" />
                              <div>
                                <p className="font-medium">{option.label}</p>
                                <p className="text-xs text-muted-foreground">{option.desc}</p>
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(watchInterestType === "pilot" || watchInterestType === "funding") && (
              <FormField
                control={form.control}
                name="investment_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Range</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select investment range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {investmentRanges.map((range) => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optional: Help set expectations for discussions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific questions or notes..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Share your thoughts or questions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Submit Interest
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}