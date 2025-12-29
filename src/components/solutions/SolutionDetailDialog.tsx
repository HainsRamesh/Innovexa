import { forwardRef } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Clock, FileText, Layers, Paperclip } from "lucide-react";

interface SolutionDetailDialogProps {
  solution: {
    id: string;
    title: string;
    description: string;
    approach?: string | null;
    technology_stack?: string[] | null;
    estimated_cost: number | null;
    timeline_weeks: number | null;
    attachments?: string[] | null;
    created_at: string;
    status: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SolutionDetailDialog = forwardRef<HTMLDivElement, SolutionDetailDialogProps>(
  function SolutionDetailDialog({ solution, open, onOpenChange }, ref) {
    if (!solution) return null;

    const formatCurrency = (amount: number | null) => {
      if (amount === null) return "Not specified";
      return `$${amount.toLocaleString()}`;
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl">{solution.title}</DialogTitle>
            {solution.status === "accepted" && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                Approved
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              Description
            </h4>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {solution.description}
            </p>
          </div>

          <Separator />

          {/* Technical Approach */}
          {solution.approach && (
            <>
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Technical Approach
                </h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {solution.approach}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Technology Stack */}
          {solution.technology_stack && solution.technology_stack.length > 0 && (
            <>
              <div>
                <h4 className="font-semibold mb-2">Technology Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {solution.technology_stack.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Cost and Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Estimated Cost</span>
              </div>
              <p className="text-lg font-semibold">
                {formatCurrency(solution.estimated_cost)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Timeline</span>
              </div>
              <p className="text-lg font-semibold">
                {solution.timeline_weeks ? `${solution.timeline_weeks} weeks` : "TBD"}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {solution.attachments && solution.attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Paperclip className="h-4 w-4 text-primary" />
                  Attachments ({solution.attachments.length})
                </h4>
                <div className="space-y-2">
                  {solution.attachments.map((attachment, index) => {
                    const fileName = attachment.split('/').pop() || `Attachment ${index + 1}`;
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);
                    
                    return (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{fileName}</span>
                        {isImage && (
                          <img 
                            src={attachment} 
                            alt={fileName}
                            className="h-8 w-8 object-cover rounded ml-auto"
                          />
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Submitted Date */}
          <div className="text-sm text-muted-foreground">
            Submitted on {format(new Date(solution.created_at), "MMMM d, yyyy")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

SolutionDetailDialog.displayName = "SolutionDetailDialog";
