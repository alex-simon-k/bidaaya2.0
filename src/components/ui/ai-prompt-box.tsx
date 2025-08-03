import React from "react";
import { ArrowUp, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";

// Utility function for className merging
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex w-full rounded-md border-none bg-transparent px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px] resize-none",
      className
    )}
    ref={ref}
    rows={1}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-blue-600 hover:bg-blue-700 text-white",
      outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    };
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6",
      icon: "h-10 w-10 rounded-full aspect-[1/1]",
    };
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-lg",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Main PromptInputBox Component
interface PromptInputBoxProps {
  onSend?: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  mode?: 'create-project' | 'find-talent';
  onModeChange?: (mode: 'create-project' | 'find-talent') => void;
}

export const PromptInputBox = React.forwardRef((props: PromptInputBoxProps, ref: React.Ref<HTMLDivElement>) => {
  const { 
    onSend = () => {}, 
    isLoading = false, 
    className,
    mode = 'create-project',
    onModeChange
  } = props;
  
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Dynamic placeholder based on mode
  const getPlaceholder = () => {
    if (mode === 'create-project') {
      return "Describe the project you want to create... e.g., 'I need a marketing intern for 3 months to help with social media campaigns'";
    } else {
      return "Describe the talent you're looking for... e.g., 'Find me Computer Science students at AUD with React experience'";
    }
  };

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim()) {
      // Add mode prefix to message
      const prefixedMessage = mode === 'create-project' 
        ? `[CREATE PROJECT]: ${input}` 
        : `[FIND TALENT]: ${input}`;
      
      onSend(prefixedMessage);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = input.trim() !== "";

  return (
    <div className={cn("w-full space-y-4", className)} ref={ref}>
      {/* Mode Toggle Buttons */}
      <div className="flex gap-3">
        <Button
          variant={mode === 'create-project' ? 'default' : 'outline'}
          className={cn(
            "flex-1 h-14 rounded-xl transition-all duration-300 text-base font-medium",
            mode === 'create-project' 
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg" 
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
          onClick={() => onModeChange?.('create-project')}
          disabled={isLoading}
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Project
        </Button>
        <Button
          variant={mode === 'find-talent' ? 'default' : 'outline'}
          className={cn(
            "flex-1 h-14 rounded-xl transition-all duration-300 text-base font-medium",
            mode === 'find-talent' 
              ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg" 
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
          onClick={() => onModeChange?.('find-talent')}
          disabled={isLoading}
        >
          <Search className="h-5 w-5 mr-2" />
          Find Talent
        </Button>
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex items-end gap-3 p-4">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              disabled={isLoading}
              className="text-base leading-relaxed"
            />
          </div>
          
          <Button
            size="icon"
            className={cn(
              "rounded-full transition-all duration-200 flex-shrink-0",
              hasContent
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg scale-100"
                : "bg-gray-200 text-gray-400 cursor-not-allowed scale-95"
            )}
            onClick={handleSubmit}
            disabled={!hasContent || isLoading}
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});
PromptInputBox.displayName = "PromptInputBox"; 