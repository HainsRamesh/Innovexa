import { useRef, useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 5;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
];

export interface PendingAttachment {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "file";
  uploading?: boolean;
  error?: string;
  progress?: number;
}

interface AttachmentPickerProps {
  onFilesSelected: (files: File[]) => void;
  currentCount: number;
  disabled?: boolean;
}

export const AttachmentPicker = ({
  onFilesSelected,
  currentCount,
  disabled,
}: AttachmentPickerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpening, setIsOpening] = useState(false);

  const validateAndProcessFiles = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = MAX_ATTACHMENTS - currentCount;
    if (remainingSlots <= 0) return;

    const validFiles: File[] = [];
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File ${file.name} exceeds 10MB limit`);
        continue;
      }
      
      if (!allowedTypes.includes(file.type)) {
        console.warn(`File ${file.name} has unsupported type: ${file.type}`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      // Reset the value so selecting the same file again triggers change
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleOpen = () => {
    if (disabled || currentCount >= MAX_ATTACHMENTS) return;
    setIsOpening(true);
    // Short delay lets the browser show the file dialog reliably on repeated clicks
    setTimeout(() => {
      fileInputRef.current?.click();
      setIsOpening(false);
    }, 10);
  };

  const remaining = MAX_ATTACHMENTS - currentCount;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES].join(",")}
        multiple
        onChange={(e) => validateAndProcessFiles(e.target.files)}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className={cn("h-8 w-8 text-muted-foreground hover:text-foreground")}
        disabled={disabled || remaining <= 0 || isOpening}
        aria-label="Add attachment"
      >
        {isOpening ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </Button>
    </>
  );
};

export const getFileIcon = (mimeType: string): "image" | "pdf" | "doc" | "spreadsheet" | "presentation" | "text" | "archive" | "file" => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word")) return "doc";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "spreadsheet";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "presentation";
  if (mimeType === "text/plain") return "text";
  if (mimeType === "application/zip") return "archive";
  return "file";
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
