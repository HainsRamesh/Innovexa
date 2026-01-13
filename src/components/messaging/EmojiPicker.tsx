import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import EmojiPickerReact, { EmojiClickData, Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export const EmojiPicker = ({ onEmojiSelect, disabled }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 text-muted-foreground hover:text-foreground")}
          disabled={disabled}
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="w-auto p-0 border-none shadow-lg"
        sideOffset={8}
      >
        <EmojiPickerReact
          onEmojiClick={handleEmojiClick}
          theme={Theme.DARK}
          width={320}
          height={400}
          searchPlaceholder="Search emoji..."
          skinTonesDisabled
          previewConfig={{ showPreview: false }}
        />
      </PopoverContent>
    </Popover>
  );
};
