import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OTPInput } from "./OTPInput";
import { Loader2, Mail, CheckCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export const EmailVerification = ({
  email,
  onVerified,
  onBack,
}: EmailVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter all 6 digits",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (error) {
        toast({
          title: "Verification failed",
          description: error.message || "Invalid or expired code. Please try again.",
          variant: "destructive",
        });
        setOtp("");
      } else {
        toast({
          title: "Email verified!",
          description: "Your account is now active.",
        });
        onVerified();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        toast({
          title: "Failed to resend",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code sent!",
          description: "Check your email for the new verification code.",
        });
        setResendCooldown(60);
        setCanResend(false);
        setOtp("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">Verify your email</h2>
        <p className="text-muted-foreground">
          We've sent a 6-digit code to
        </p>
        <p className="font-medium text-foreground">{email}</p>
      </div>

      <div className="space-y-4">
        <OTPInput
          value={otp}
          onChange={setOtp}
          disabled={isVerifying}
        />

        <Button
          onClick={handleVerify}
          disabled={otp.length !== 6 || isVerifying}
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

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
        </p>
        <Button
          variant="outline"
          onClick={handleResend}
          disabled={!canResend || isResending}
          className="gap-2"
        >
          {isResending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {canResend ? "Resend Code" : `Resend in ${resendCooldown}s`}
        </Button>
      </div>

      <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
        Use a different email
      </Button>
    </div>
  );
};
