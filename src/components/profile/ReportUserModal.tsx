import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string | null;
  onSubmit: (reason: string, description?: string) => Promise<void>;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "fake_profile", label: "Fake or misleading profile" },
  { value: "other", label: "Other" },
];

export const ReportUserModal = ({
  open,
  onOpenChange,
  userName,
  onSubmit,
}: ReportUserModalProps) => {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason, description || undefined);
      setReason("");
      setDescription("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <Flag className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Report {userName || "this user"}</DialogTitle>
          </div>
          <DialogDescription>
            Help us understand what's wrong. Your report is confidential.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Why are you reporting this account?</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Additional details <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any additional context..."
              className="bg-background border-border min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="bg-secondary hover:bg-secondary/80"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
