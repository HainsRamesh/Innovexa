import { useEffect, useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";
import { cn } from "@/lib/utils";

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  focusTargetRef?: React.RefObject<HTMLElement>;
}

export const EmojiPickerPopover = ({
  onEmojiSelect,
  disabled,
  focusTargetRef,
}: EmojiPickerPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(typeof window !== "undefined");
  }, []);

  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  const handleSelect = (emojiData: { emoji: string }) => {
    onEmojiSelect(emojiData.emoji);
    focusTargetRef?.current?.focus();
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
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Insert emoji"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="p-0 border-none shadow-xl bg-popover z-[10000]"
        sideOffset={8}
      >
        {isClient ? (
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleSelect}
            lazyLoadEmojis
            searchPlaceholder="Search"
            emojiStyle={EmojiStyle.NATIVE}
            width={320}
            height={380}
            previewConfig={{ showPreview: false }}
          />
        ) : (
          <div className="p-3 text-xs text-muted-foreground">Loading emojis…</div>
        )}
      </PopoverContent>
    </Popover>
  );
};
