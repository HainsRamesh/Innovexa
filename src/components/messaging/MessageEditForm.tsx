import { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageEditFormProps {
  initialText: string;
  onSave: (newText: string) => void;
  onCancel: () => void;
  isOwn: boolean;
}

export const MessageEditForm = ({
  initialText,
  onSave,
  onCancel,
  isOwn,
}: MessageEditFormProps) => {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, []);

  const handleSave = () => {
    if (text.trim() && text.trim() !== initialText) {
      onSave(text.trim());
    } else if (text.trim() === initialText) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-2 rounded-xl",
        isOwn ? "bg-primary/20" : "bg-muted"
      )}
    >
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[60px] text-sm resize-none bg-background border-border"
        placeholder="Edit message..."
      />
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-7 px-2"
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!text.trim()}
          className="h-7 px-2"
        >
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
};
