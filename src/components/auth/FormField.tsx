import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, showPasswordToggle, type, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="space-y-2">
        <Label 
          htmlFor={fieldId} 
          className={cn("text-sm font-medium", error && "text-destructive")}
        >
          {label}
        </Label>
        
        <div className="relative">
          <Input
            ref={ref}
            id={fieldId}
            type={inputType}
            className={cn(
              "transition-colors",
              error && "border-destructive focus-visible:ring-destructive/50",
              isPassword && showPasswordToggle && "pr-10",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
            {...props}
          />
          
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        
        {error && (
          <div 
            id={`${fieldId}-error`}
            className="flex items-center gap-1.5 text-xs text-destructive animate-in fade-in-0 slide-in-from-top-1 duration-200"
            role="alert"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {!error && hint && (
          <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
