import { useState } from "react";
import { Download, FileText, File, ExternalLink, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatFileSize, getFileIcon } from "./AttachmentPicker";

export interface MessageAttachmentData {
  id: string;
  url: string;
  file_name: string;
  mime_type: string;
  size: number;
  thumbnail_url?: string | null;
}

interface MessageAttachmentProps {
  attachment: MessageAttachmentData;
  isOwn: boolean;
}

export const MessageAttachment = ({ attachment, isOwn }: MessageAttachmentProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImage = attachment.mime_type.startsWith("image/");

  const handleDownload = async () => {
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const getIconForType = (iconType: string) => {
    const iconClass = "h-5 w-5";
    switch (iconType) {
      case "pdf":
        return <FileText className={cn(iconClass, "text-red-500")} />;
      case "doc":
        return <FileText className={cn(iconClass, "text-blue-500")} />;
      case "spreadsheet":
        return <FileText className={cn(iconClass, "text-green-500")} />;
      case "presentation":
        return <FileText className={cn(iconClass, "text-orange-500")} />;
      case "text":
        return <FileText className={cn(iconClass, "text-gray-500")} />;
      case "archive":
        return <File className={cn(iconClass, "text-yellow-500")} />;
      default:
        return <File className={iconClass} />;
    }
  };

  if (isImage) {
    return (
      <>
        <div 
          className="relative cursor-pointer group rounded-lg overflow-hidden max-w-[240px]"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={attachment.thumbnail_url || attachment.url}
            alt={attachment.file_name}
            className="w-full h-auto max-h-[200px] object-cover rounded-lg"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Lightbox */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-none">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="flex items-center justify-center p-4">
              <img
                src={attachment.url}
                alt={attachment.file_name}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(attachment.url, "_blank")}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // File attachment card
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border max-w-[260px]",
        isOwn 
          ? "bg-primary-foreground/10 border-primary-foreground/20" 
          : "bg-muted/50 border-border"
      )}
    >
      <div className="flex-shrink-0">
        {getIconForType(getFileIcon(attachment.mime_type))}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isOwn ? "text-primary-foreground" : "text-foreground"
        )}>
          {attachment.file_name}
        </p>
        <p className={cn(
          "text-xs",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 flex-shrink-0",
          isOwn ? "text-primary-foreground hover:bg-primary-foreground/10" : ""
        )}
        onClick={handleDownload}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface MessageAttachmentsListProps {
  attachments: MessageAttachmentData[];
  isOwn: boolean;
}

export const MessageAttachmentsList = ({ attachments, isOwn }: MessageAttachmentsListProps) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-1">
      {attachments.map((attachment) => (
        <MessageAttachment key={attachment.id} attachment={attachment} isOwn={isOwn} />
      ))}
    </div>
  );
};
