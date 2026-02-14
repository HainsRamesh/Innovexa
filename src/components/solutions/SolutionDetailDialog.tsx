import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import {
  Drawer,
  DrawerContent } from
"@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/contexts/LoadingContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DollarSign,
  Clock,
  FileText,
  Layers,
  Paperclip,
  Download,
  Loader2,
  FileImage,
  File,
  Target,
  ExternalLink,
  X,
  ArrowLeft } from
"lucide-react";

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
    innovator_id?: string;
    problem_id?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FILE_TYPE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage
};

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

const getFileIcon = (filename: string) => {
  const ext = getFileExtension(filename);
  return FILE_TYPE_ICONS[ext] || File;
};

function SolutionDetailContent({
  solution,
  onClose,
  isMobile




}: {solution: NonNullable<SolutionDetailDialogProps["solution"]>;onClose: () => void;isMobile: boolean;}) {
  const { toast } = useToast();
  const { startLoading, stopLoading } = useGlobalLoading();
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [linkedProblem, setLinkedProblem] = useState<{id: string;title: string;category: string;} | null>(null);

  useEffect(() => {
    if (solution?.problem_id) {
      supabase.
      from("problems").
      select("id, title, category").
      eq("id", solution.problem_id).
      single().
      then(({ data }) => {
        setLinkedProblem(data ?? null);
      });
    }
    return () => setLinkedProblem(null);
  }, [solution?.problem_id]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "Not specified";
    return `$${amount.toLocaleString()}`;
  };

  const handleDownload = async (path: string, index: number) => {
    setDownloadingIndex(index);
    startLoading("Preparing download…");
    try {
      const { data, error } = await supabase.storage.
      from("solution-attachments").
      createSignedUrl(path, 60 * 5);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error generating download link:", error);
      toast({
        title: "Download failed",
        description: "Could not generate download link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingIndex(null);
      stopLoading();
    }
  };

  return (
    <>
      {/* Mobile header bar */}
      {isMobile &&
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <h2 className="text-base font-semibold truncate">Solution Details</h2>
          <button
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-muted transition-colors"
          aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
      }

      <div className={isMobile ? "px-4 py-4 space-y-6 pb-[env(safe-area-inset-bottom,1rem)]" : "space-y-6 mt-4"}>
        {/* Title (shown inside content for desktop, or below header for mobile) */}
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xl font-semibold break-words">{solution.title}</h3>
          {solution.status === "accepted" &&
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              Approved
            </Badge>
          }
        </div>

        {/* Linked Problem */}
        {linkedProblem &&
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Linked Problem</p>
                  <p className="font-medium text-sm break-words">{linkedProblem.title}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0 w-full sm:w-auto">
                <Link to={`/explore/${linkedProblem.id}`} onClick={onClose}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  View Problem
                </Link>
              </Button>
            </div>
            <Separator />
          </>
        }

        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            Description
          </h4>
          <p className="text-muted-foreground whitespace-pre-wrap">{solution.description}</p>
        </div>

        <Separator />

        {solution.approach &&
        <>
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4 text-primary" />
                Technical Approach
              </h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{solution.approach}</p>
            </div>
            <Separator />
          </>
        }

        {solution.technology_stack && solution.technology_stack.length > 0 &&
        <>
            <div>
              <h4 className="font-semibold mb-2">Technology Stack</h4>
              <div className="flex flex-wrap gap-2">
                {solution.technology_stack.map((tech) =>
              <Badge key={tech} variant="secondary">{tech}</Badge>
              )}
              </div>
            </div>
            <Separator />
          </>
        }

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Estimated Cost</span>
            </div>
            <p className="text-lg font-semibold break-words">{formatCurrency(solution.estimated_cost)}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Timeline</span>
            </div>
            <p className="text-lg font-semibold">
              {solution.timeline_weeks ? `${solution.timeline_weeks} weeks` : "TBD"}
            </p>
          </div>
        </div>

        {solution.attachments && solution.attachments.length > 0 &&
        <>
            <Separator />
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-primary" />
                Attachments ({solution.attachments.length})
              </h4>
              <div className="space-y-2">
                {solution.attachments.map((path, index) => {
                const fileName = path.split("/").pop() || `Attachment ${index + 1}`;
                const ext = getFileExtension(fileName).toUpperCase();
                const IconComponent = getFileIcon(fileName);
                const isDownloading = downloadingIndex === index;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{fileName}</p>
                        <Badge variant="outline" className="text-xs">{ext || "FILE"}</Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(path, index)} disabled={isDownloading} className="shrink-0">
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4 mr-1" />Open</>}
                      </Button>
                    </div>);

              })}
              </div>
            </div>
          </>
        }

        {(!solution.attachments || solution.attachments.length === 0) &&
        <>
            <Separator />
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-primary" />
                Attachments
              </h4>
              <div className="text-center py-4 text-muted-foreground">
                <Paperclip className="h-6 w-6 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No attachments uploaded</p>
              </div>
            </div>
          </>
        }

        <div className="text-sm text-muted-foreground">
          Submitted on {format(new Date(solution.created_at), "MMMM d, yyyy")}
        </div>
      </div>
    </>);

}

export function SolutionDetailDialog({ solution, open, onOpenChange }: SolutionDetailDialogProps) {
  const isMobile = useIsMobile();

  if (!solution) return null;

  const handleClose = () => onOpenChange(false);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="h-full w-full max-w-full rounded-none inset-0 mt-0 [&>div:first-child]:hidden">
          <ScrollArea className="h-full">
            <SolutionDetailContent solution={solution} onClose={handleClose} isMobile />
          </ScrollArea>
        </DrawerContent>
      </Drawer>);

  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto p-4 sm:p-6" aria-describedby="solution-detail-description">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-muted/80 p-1.5 hover:bg-muted transition-colors"
          aria-label="Close">

          <X className="h-4 w-4" />
        </button>
        <DialogHeader>
          <DialogTitle className="sr-only">Solution Details</DialogTitle>
          <DialogDescription id="solution-detail-description" className="sr-only">
            View the details of this solution including description, approach, and attachments.
          </DialogDescription>
        </DialogHeader>
        <SolutionDetailContent solution={solution} onClose={handleClose} isMobile={false} />
      </DialogContent>
    </Dialog>);

}