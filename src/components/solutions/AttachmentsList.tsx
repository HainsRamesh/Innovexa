import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Paperclip,
  Download,
  ExternalLink,
  FileText,
  FileImage,
  File,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/contexts/LoadingContext";

interface AttachmentInfo {
  name: string;
  path: string;
  type: string;
  size?: number;
}

interface AttachmentsListProps {
  attachments: string[] | null;
  innovatorId: string;
  title?: string;
  showCard?: boolean;
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
  webp: FileImage,
};

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

const getFileIcon = (filename: string) => {
  const ext = getFileExtension(filename);
  return FILE_TYPE_ICONS[ext] || File;
};

export function AttachmentsList({
  attachments,
  innovatorId,
  title = "Attachments",
  showCard = true,
}: AttachmentsListProps) {
  const { toast } = useToast();
  const { startLoading, stopLoading } = useGlobalLoading();
  const [isLoading, setIsLoading] = useState(true);
  const [attachmentInfos, setAttachmentInfos] = useState<AttachmentInfo[]>([]);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!attachments || attachments.length === 0) {
      setIsLoading(false);
      setAttachmentInfos([]);
      return;
    }

    // Parse attachment info from stored paths
    const infos: AttachmentInfo[] = attachments.map((path) => {
      const fileName = path.split("/").pop() || "Unknown file";
      const ext = getFileExtension(fileName);
      return {
        name: fileName,
        path,
        type: ext.toUpperCase() || "FILE",
      };
    });

    setAttachmentInfos(infos);
    setIsLoading(false);
  }, [attachments]);

  const handleDownload = async (attachment: AttachmentInfo, index: number) => {
    setDownloadingIndex(index);
    startLoading("Preparing download…");

    try {
      // Generate a signed URL for the file
      const { data, error } = await supabase.storage
        .from("solution-attachments")
        .createSignedUrl(attachment.path, 60 * 5); // 5 minutes expiry

      if (error) {
        throw error;
      }

      if (data?.signedUrl) {
        // Open the signed URL in a new tab
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("Error generating download link:", error);
      toast({
        title: "Download failed",
        description: "Could not generate download link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingIndex(null);
      stopLoading();
    }
  };

  if (isLoading) {
    return showCard ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    const emptyContent = (
      <div className="text-center py-6 text-muted-foreground">
        <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No attachments uploaded</p>
      </div>
    );

    return showCard ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{emptyContent}</CardContent>
      </Card>
    ) : (
      emptyContent
    );
  }

  const content = (
    <div className="space-y-2">
      {attachmentInfos.map((attachment, index) => {
        const IconComponent = getFileIcon(attachment.name);
        const isDownloading = downloadingIndex === index;

        return (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{attachment.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {attachment.type}
                </Badge>
                {attachment.size && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(attachment, index)}
              disabled={isDownloading}
              className="shrink-0"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Open
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );

  return showCard ? (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          {title} ({attachmentInfos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  ) : (
    content
  );
}
