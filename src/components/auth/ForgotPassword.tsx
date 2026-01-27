import { useState, useEffect, useCallback, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { OTPInput } from "./OTPInput";
import { FormField } from "./FormField";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { Loader2, Mail, KeyRound, CheckCircle, ArrowLeft, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getAuthErrorMessage, validateEmail, validatePassword } from "@/lib/authErrors";
import { cn } from "@/lib/utils";

type ForgotPasswordStep = "email" | "code" | "newPassword" | "success";

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ForgotPassword = forwardRef<HTMLDivElement, ForgotPasswordProps>(({ onBack, onSuccess }, ref) => {
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendCode = useCallback(async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        const message = getAuthErrorMessage(error);
        setErrors({ email: message });
        toast({
          title: "Unable to send code",
          description: message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code sent!",
          description: "Check your email for the password reset code.",
        });
        setStep("code");
        setResendCooldown(60);
      }
    } catch (err: any) {
      const message = getAuthErrorMessage(err);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, toast]);

  const handleVerifyCode = useCallback(async () => {
    if (otp.length !== 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    setOtpError("");
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "recovery",
      });

      if (error) {
        const message = getAuthErrorMessage(error);
        setOtpError(message);
        toast({
          title: "Invalid code",
          description: message,
          variant: "destructive",
        });
        setOtp("");
      } else {
        setStep("newPassword");
      }
    } catch (err: any) {
      const message = getAuthErrorMessage(err);
      setOtpError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [otp, email, toast]);

  const handleResetPassword = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        const message = getAuthErrorMessage(error);
        setErrors({ password: message });
        toast({
          title: "Password reset failed",
          description: message,
          variant: "destructive",
        });
      } else {
        setStep("success");
        toast({
          title: "Password reset! ✓",
          description: "Your password has been updated successfully.",
        });
      }
    } catch (err: any) {
      const message = getAuthErrorMessage(err);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [newPassword, confirmPassword, toast]);

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0) return;
    await handleSendCode();
  }, [resendCooldown, handleSendCode]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (step === "code" && otp.length === 6 && !isLoading) {
      handleVerifyCode();
    }
  }, [otp, step, isLoading, handleVerifyCode]);

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {["email", "code", "newPassword"].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
            step === s ? "bg-primary text-primary-foreground" :
            ["code", "newPassword", "success"].indexOf(step) > i ? "bg-primary/20 text-primary" :
            "bg-secondary text-muted-foreground"
          )}>
            {i + 1}
          </div>
          {i < 2 && (
            <div className={cn(
              "w-8 h-0.5 transition-colors",
              ["code", "newPassword", "success"].indexOf(step) > i ? "bg-primary/50" : "bg-secondary"
            )} />
          )}
        </div>
      ))}
    </div>
  );

  // Success state
  if (step === "success") {
    return (
      <div ref={ref} className="space-y-6 text-center py-6 px-2 animate-in fade-in-0 duration-300">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in-50 duration-300">
            <ShieldCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Password Reset Complete!</h2>
          <p className="text-muted-foreground">
            Your password has been successfully updated.<br />
            You can now sign in with your new password.
          </p>
        </div>
        <Button onClick={onSuccess} variant="hero" className="w-full" size="lg">
          Sign In with New Password
        </Button>
      </div>
    );
  }

  // New password step
  if (step === "newPassword") {
    return (
      <div ref={ref} className="space-y-6 py-6 px-2">
        <StepIndicator />
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Create New Password</h2>
          <p className="text-muted-foreground">
            Choose a strong password for your account
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <FormField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="Enter new password"
              disabled={isLoading}
              error={errors.password}
              showPasswordToggle
              autoComplete="new-password"
            />
            {newPassword && <PasswordStrengthIndicator password={newPassword} />}
          </div>

          <FormField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            placeholder="Confirm new password"
            disabled={isLoading}
            error={errors.confirmPassword}
            showPasswordToggle
            autoComplete="new-password"
          />

          <Button
            onClick={handleResetPassword}
            disabled={isLoading || !newPassword || !confirmPassword}
            variant="hero"
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Resetting Password...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Reset Password
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // OTP code step
  if (step === "code") {
    return (
      <div ref={ref} className="space-y-6 text-center py-6 px-2">
        <StepIndicator />
        
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to
          </p>
          <p className="font-medium text-foreground break-all">{email}</p>
        </div>

        <div className="space-y-4 pt-2">
          <OTPInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              setOtpError("");
            }}
            disabled={isLoading}
            error={!!otpError}
          />

          {otpError && (
            <div 
              className="flex items-center justify-center gap-2 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          <Button
            onClick={handleVerifyCode}
            disabled={otp.length !== 6 || isLoading}
            variant="hero"
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Code
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
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className={cn("h-4 w-4", resendCooldown > 0 && "opacity-50")} />
            )}
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => setStep("email")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Use a different email
        </Button>
      </div>
    );
  }

  // Email step (default)
  return (
    <div ref={ref} className="space-y-6 py-6 px-2">
      <StepIndicator />
      
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
        <p className="text-muted-foreground">
          Enter your email and we'll send you a code to reset your password
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors({});
          }}
          placeholder="you@example.com"
          disabled={isLoading}
          error={errors.email}
          autoComplete="email"
          autoFocus
        />

        <Button
          onClick={handleSendCode}
          disabled={isLoading || !email}
          variant="hero"
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sending Code...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Send Reset Code
            </>
          )}
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={onBack}
        className="w-full text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Sign In
      </Button>
    </div>
  );
});

ForgotPassword.displayName = "ForgotPassword";
