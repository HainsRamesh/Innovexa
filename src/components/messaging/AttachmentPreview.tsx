import { X, FileText, Image as ImageIcon, File, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PendingAttachment, formatFileSize, getFileIcon } from "./AttachmentPicker";

interface AttachmentPreviewProps {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
}

export const AttachmentPreview = ({ attachments, onRemove, onRetry }: AttachmentPreviewProps) => {
  if (attachments.length === 0) return null;

  const getIconForType = (iconType: string) => {
    switch (iconType) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "doc":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "spreadsheet":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "presentation":
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border-t border-border bg-muted/30">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className={cn(
            "relative group rounded-lg overflow-hidden border border-border bg-background",
            attachment.error && "border-destructive",
            attachment.type === "image" ? "w-16 h-16" : "flex items-center gap-2 px-3 py-2 max-w-[200px]"
          )}
        >
          {attachment.type === "image" ? (
            <>
              {attachment.preview && (
                <img
                  src={attachment.preview}
                  alt={attachment.file.name}
                  className="w-full h-full object-cover"
                />
              )}
              {attachment.uploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              {attachment.error && (
                <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] text-destructive">Failed</span>
                  {onRetry && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => onRetry(attachment.id)}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {getIconForType(getFileIcon(attachment.file.type))}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{attachment.file.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatFileSize(attachment.file.size)}
                </p>
                {attachment.uploading && (
                  <Progress value={attachment.progress || 0} className="h-1 mt-1" />
                )}
                {attachment.error && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-destructive">Failed</span>
                    {onRetry && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => onRetry(attachment.id)}
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Remove button */}
          <Button
            size="icon"
            variant="destructive"
            className={cn(
              "absolute h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
              attachment.type === "image" ? "top-0.5 right-0.5" : "-top-1 -right-1"
            )}
            onClick={() => onRemove(attachment.id)}
            disabled={attachment.uploading}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};
