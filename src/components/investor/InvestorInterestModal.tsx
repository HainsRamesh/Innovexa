import { useState, useEffect, useRef } from "react";
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
import { 
  Loader2, 
  TrendingUp, 
  MessageCircle, 
  Rocket, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
  Coins,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const TOTAL_PANELS = 3;

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
  const [currentPanel, setCurrentPanel] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Reset to first panel when modal opens
  useEffect(() => {
    if (open) {
      setCurrentPanel(0);
      setTimeout(() => {
        scrollToPanel(0);
      }, 100);
    }
  }, [open]);

  const watchInterestType = form.watch("interest_type");
  const watchInvestorName = form.watch("investor_name");

  // Scroll to a specific panel
  const scrollToPanel = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const panelWidth = container.offsetWidth;
      container.scrollTo({
        left: index * panelWidth,
        behavior: "smooth",
      });
    }
  };

  // Handle scroll event to update current panel indicator
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const panelWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;
      const newPanel = Math.round(scrollLeft / panelWidth);
      if (newPanel !== currentPanel && newPanel >= 0 && newPanel < TOTAL_PANELS) {
        setCurrentPanel(newPanel);
      }
    }
  };

  // Navigate to next/prev panel
  const goToPanel = (direction: "next" | "prev") => {
    const newIndex = direction === "next" 
      ? Math.min(currentPanel + 1, TOTAL_PANELS - 1)
      : Math.max(currentPanel - 1, 0);
    setCurrentPanel(newIndex);
    scrollToPanel(newIndex);
  };

  // Check if can proceed to next panel
  const canProceedToPanel2 = () => {
    return watchInvestorName?.trim().length > 0 && watchInterestType;
  };

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
      setCurrentPanel(0);
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

  // Panel indicator dots
  const PanelIndicators = () => (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: TOTAL_PANELS }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => {
            // Only allow going back or to panel 2 if requirements met
            if (index < currentPanel || (index === 1 && canProceedToPanel2()) || index === 0) {
              setCurrentPanel(index);
              scrollToPanel(index);
            }
          }}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            currentPanel === index 
              ? "w-6 bg-primary" 
              : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
          )}
          aria-label={`Go to panel ${index + 1}`}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ready to Invest
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            Express your interest in: <strong className="text-foreground">{targetTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Horizontal scroll container */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x"
              style={{ 
                scrollbarWidth: "none", 
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch"
              }}
            >
              {/* Panel 1: Name + Type of Interest */}
              <div className="min-w-full w-full flex-shrink-0 snap-center p-6 space-y-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <User className="h-4 w-4" />
                  <span>Step 1 of 3: Your Information</span>
                </div>

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
              </div>

              {/* Panel 2: Investment Range + Message */}
              <div className="min-w-full w-full flex-shrink-0 snap-center p-6 space-y-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Coins className="h-4 w-4" />
                  <span>Step 2 of 3: Investment Details</span>
                </div>

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

                {watchInterestType === "discussion" && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      You selected <strong className="text-foreground">Discussion</strong>. 
                      No investment range needed—just share your questions or thoughts below.
                    </p>
                  </div>
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
                          className="min-h-[100px]"
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
              </div>

              {/* Panel 3: Review + Submit */}
              <div className="min-w-full w-full flex-shrink-0 snap-center p-6 space-y-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Send className="h-4 w-4" />
                  <span>Step 3 of 3: Review & Submit</span>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Review Your Interest</h3>
                  
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="text-sm font-medium text-right max-w-[60%] truncate">
                        {watchInvestorName || "—"}
                      </span>
                    </div>
                    <div className="border-t border-border/30" />
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Interest Type</span>
                      <span className="text-sm font-medium capitalize">
                        {watchInterestType === "pilot" ? "Pilot / POC" : watchInterestType || "—"}
                      </span>
                    </div>
                    {(watchInterestType === "pilot" || watchInterestType === "funding") && form.watch("investment_range") && (
                      <>
                        <div className="border-t border-border/30" />
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Investment Range</span>
                          <span className="text-sm font-medium">
                            {investmentRanges.find(r => r.value === form.watch("investment_range"))?.label || "—"}
                          </span>
                        </div>
                      </>
                    )}
                    {form.watch("message") && (
                      <>
                        <div className="border-t border-border/30" />
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Message</span>
                          <p className="text-sm text-foreground line-clamp-3">
                            {form.watch("message")}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting, you'll notify the innovator and enterprise of your interest.
                  </p>
                </div>
              </div>
            </div>

            {/* Panel indicators */}
            <PanelIndicators />

            {/* Navigation footer */}
            <div className="flex items-center gap-3 p-4 border-t border-border/50 bg-muted/20">
              {/* Left button */}
              {currentPanel > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToPanel("prev")}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}

              {/* Right button */}
              {currentPanel < TOTAL_PANELS - 1 ? (
                <Button
                  type="button"
                  onClick={() => goToPanel("next")}
                  disabled={currentPanel === 0 && !canProceedToPanel2()}
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !canProceedToPanel2()} 
                  className="flex-1"
                >
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
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
