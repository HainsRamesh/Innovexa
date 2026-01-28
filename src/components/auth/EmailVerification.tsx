import { useState, useEffect, useCallback, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { OTPInput } from "./OTPInput";
import { Loader2, Mail, CheckCircle, RefreshCw, ArrowLeft, AlertCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { cn } from "@/lib/utils";
import {
  DEV_AUTH_BYPASS_ENABLED,
  DEV_AUTH_BYPASS_TEST_EMAIL,
  DEV_AUTH_BYPASS_TEST_OTP,
  isDevBypassVerified,
  setDevBypassVerified,
} from "@/lib/devAuthBypass";

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

// DEV bypass configuration (NEVER active in production builds)
const DEV_AUTH_BYPASS = DEV_AUTH_BYPASS_ENABLED;

export const EmailVerification = forwardRef<HTMLDivElement, EmailVerificationProps>(({
  email,
  onVerified,
  onBack,
}, ref) => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(DEV_AUTH_BYPASS ? 0 : 60);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Display email (use test email in dev bypass mode)
  const displayEmail = DEV_AUTH_BYPASS ? DEV_AUTH_BYPASS_TEST_EMAIL : email;

  // Auto-fill OTP in DEV mode
  useEffect(() => {
    if (DEV_AUTH_BYPASS && otp === "") {
      setOtp(DEV_AUTH_BYPASS_TEST_OTP);
    }
  }, [otp]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = useCallback(async () => {
    if (otp.length !== 8) {
      setError("Please enter all 8 digits");
      return;
    }

    setIsVerifying(true);
    setError("");
    
    try {
      // DEV BYPASS: Skip real verification
      if (DEV_AUTH_BYPASS && otp === DEV_AUTH_BYPASS_TEST_OTP) {
        setDevBypassVerified(true);
        console.log("[EmailVerification][DEV] BYPASS verify", {
          displayEmail,
          dev_email_verified: isDevBypassVerified(),
        });
        setIsSuccess(true);
        toast({
          title: "DEV MODE: Email verified! ✓",
          description: "Bypassing real verification. Redirecting...",
        });
        setTimeout(onVerified, 1000);
        return;
      }

      console.log("[EmailVerification] Verifying OTP for:", email);
      
      // Try signup type first, then email type as fallback
      let result = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      // If signup type fails, try email type (for resent codes)
      if (result.error && result.error.message?.includes("invalid")) {
        console.log("[EmailVerification] Trying email type verification");
        result = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: "email",
        });
      }

      if (result.error) {
        const message = getAuthErrorMessage(result.error);
        console.error("[EmailVerification] Verification failed:", result.error);
        setError(message);
        toast({
          title: "Verification failed",
          description: message,
          variant: "destructive",
        });
        setOtp("");
      } else {
        console.log("[EmailVerification] OTP verified successfully, session:", !!result.data.session);
        setIsSuccess(true);
        toast({
          title: "Email verified! ✓",
          description: "Your account is now active. Redirecting...",
        });
        // Brief delay to show success state, then call onVerified
        setTimeout(onVerified, 1000);
      }
    } catch (err: any) {
      console.error("[EmailVerification] Unexpected error:", err);
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
    
    // DEV BYPASS: Just reset the OTP
    if (DEV_AUTH_BYPASS) {
      setError("");
      // Clear first so the autofill effect re-runs (also clears previous UI errors)
      setOtp("");
      toast({
        title: "DEV MODE: Code reset",
        description: "OTP auto-filled with test code.",
      });
      return;
    }
    
    setIsResending(true);
    setError("");
    
    try {
      console.log("[EmailVerification] Resending OTP to:", email);
      
      // Use resend with signup type to get OTP code
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        console.error("[EmailVerification] Resend failed:", resendError);
        const message = getAuthErrorMessage(resendError);
        toast({
          title: "Failed to resend",
          description: message,
          variant: "destructive",
        });
      } else {
        console.log("[EmailVerification] OTP resent successfully");
        toast({
          title: "Code sent!",
          description: "Check your email for the new 8-digit verification code.",
        });
        setResendCooldown(60);
        setOtp("");
      }
    } catch (err: any) {
      console.error("[EmailVerification] Resend error:", err);
      toast({
        title: "Error",
        description: getAuthErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  }, [email, resendCooldown, toast]);

  // Auto-submit when OTP is complete (disabled in dev mode to allow manual click)
  useEffect(() => {
    if (!DEV_AUTH_BYPASS && otp.length === 8 && !isVerifying && !isSuccess) {
      handleVerify();
    }
  }, [otp, isVerifying, isSuccess, handleVerify]);

  if (isSuccess) {
    return (
      <div ref={ref} className="space-y-6 text-center py-6 animate-in fade-in-0 duration-300">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in-50 duration-300">
            <CheckCircle className="h-8 w-8 text-primary" />
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
      {/* DEV MODE BANNER */}
      {DEV_AUTH_BYPASS && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mx-2">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold text-sm">DEV MODE: OTP bypass enabled</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Auto-filled with test code. Click Verify to continue.
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Verify your email</h2>
        <p className="text-muted-foreground">
          We've sent an 8-digit code to
        </p>
        <p className="font-medium text-foreground break-all px-4">{displayEmail}</p>
      </div>

      <div className="space-y-4 pt-2 px-2">
        <OTPInput
          length={8}
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
          disabled={otp.length !== 8 || isVerifying}
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
