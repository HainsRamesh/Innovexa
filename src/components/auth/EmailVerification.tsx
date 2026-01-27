import { useState, useEffect, useCallback, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { OTPInput } from "./OTPInput";
import { Loader2, Mail, CheckCircle, RefreshCw, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { cn } from "@/lib/utils";

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export const EmailVerification = forwardRef<HTMLDivElement, EmailVerificationProps>(({
  email,
  onVerified,
  onBack,
}, ref) => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
    setError("");
    
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (verifyError) {
        const message = getAuthErrorMessage(verifyError);
        setError(message);
        toast({
          title: "Verification failed",
          description: message,
          variant: "destructive",
        });
        setOtp("");
      } else {
        setIsSuccess(true);
        toast({
          title: "Email verified! ✓",
          description: "Your account is now active. Redirecting to sign in...",
        });
        // Brief delay to show success state
        setTimeout(onVerified, 1500);
      }
    } catch (err: any) {
      const message = getAuthErrorMessage(err);
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [otp, email, onVerified, toast]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setError("");
    
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: undefined, // Force OTP instead of link
        },
      });

      if (resendError) {
        const message = getAuthErrorMessage(resendError);
        toast({
          title: "Failed to resend",
          description: message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code sent!",
          description: "Check your email for the new 6-digit verification code.",
        });
        setResendCooldown(60);
        setOtp("");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: getAuthErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  }, [email, resendCooldown, toast]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isVerifying && !isSuccess) {
      handleVerify();
    }
  }, [otp, isVerifying, isSuccess, handleVerify]);

  if (isSuccess) {
    return (
      <div ref={ref} className="space-y-6 text-center py-6 animate-in fade-in-0 duration-300">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in-50 duration-300">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
          <p className="text-muted-foreground">
            Your account is now active. Redirecting you to sign in...
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6 text-center py-6">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Verify your email</h2>
        <p className="text-muted-foreground">
          We've sent a 6-digit code to
        </p>
        <p className="font-medium text-foreground break-all px-4">{email}</p>
      </div>

      <div className="space-y-4 pt-2 px-2">
        <OTPInput
          value={otp}
          onChange={(val) => {
            setOtp(val);
            setError("");
          }}
          disabled={isVerifying}
          error={!!error}
        />

        {error && (
          <div 
            className="flex items-center justify-center gap-2 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleVerify}
          disabled={otp.length !== 6 || isVerifying}
          variant="hero"
          className="w-full"
          size="lg"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Email
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3 pt-2">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
        </p>
        <Button
          variant="outline"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
          className="gap-2"
        >
          {isResending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className={cn("h-4 w-4", resendCooldown > 0 && "opacity-50")} />
          )}
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
        </Button>
      </div>

      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Use a different email
      </Button>
    </div>
  );
});

EmailVerification.displayName = "EmailVerification";
