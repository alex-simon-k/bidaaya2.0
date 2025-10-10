"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";

interface AIInputWithSearchProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit?: (value: string, withSearch: boolean) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
}

export function AIInputWithSearch({
  id = "ai-input-with-search",
  placeholder = "Ask me anything...",
  minHeight = 44,
  maxHeight = 120,
  onSubmit,
  onFileSelect,
  className
}: AIInputWithSearchProps) {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit?.(value, false);
      setValue("");
      adjustHeight(true);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative max-w-2xl w-full mx-auto">
        <div className="relative flex items-center bg-bidaaya-light/10 rounded-2xl border border-bidaaya-light/20 overflow-hidden">
          <Textarea
            id={id}
            value={value}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 bg-transparent border-none text-bidaaya-light placeholder:text-bidaaya-light/50 resize-none focus-visible:ring-0 leading-[1.3] min-h-[44px]"
            style={{ maxHeight: `${maxHeight}px` }}
            ref={textareaRef}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onChange={(e) => {
              setValue(e.target.value);
              adjustHeight();
            }}
          />
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              "mr-2 p-2.5 rounded-xl transition-all",
              value.trim()
                ? "bg-bidaaya-accent text-white hover:bg-bidaaya-accent/90"
                : "bg-bidaaya-light/5 text-bidaaya-light/30 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
