import { useMemo } from "react";
import { getPasswordStrength, type PasswordStrength } from "@/lib/authErrors";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

const strengthColors: Record<PasswordStrength, string> = {
  weak: "bg-destructive",
  fair: "bg-orange-500",
  good: "bg-yellow-500",
  strong: "bg-green-500",
};

const strengthLabels: Record<PasswordStrength, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
];

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = true 
}: PasswordStrengthIndicatorProps) {
  const { strength, score } = useMemo(() => getPasswordStrength(password), [password]);
  
  if (!password) return null;
  
  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            strength === "weak" && "text-destructive",
            strength === "fair" && "text-orange-500",
            strength === "good" && "text-yellow-600",
            strength === "strong" && "text-green-500"
          )}>
            {strengthLabels[strength]}
          </span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", strengthColors[strength])}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      
      {/* Requirements checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-1">
          {requirements.map((req) => {
            const met = req.test(password);
            return (
              <div 
                key={req.label} 
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  met ? "text-green-500" : "text-muted-foreground"
                )}
              >
                {met ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                <span>{req.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
