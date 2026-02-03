import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, ArrowLeft, Building2, Rocket, TrendingUp, Shield, Loader2 } from "lucide-react";
// Footer removed for clean auth screens
import { AppRole } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { EmailVerification, ForgotPassword } from "@/components/auth";
import { FormField } from "@/components/auth/FormField";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { getAuthErrorMessage, validateEmail, validatePassword, validateName } from "@/lib/authErrors";

type AuthView = "signIn" | "signUp" | "verify" | "forgotPassword";

const roleOptions = [
  {
    value: "innovator" as AppRole,
    label: "Innovator",
    description: "Submit solutions to real-world problems",
    icon: <Rocket className="h-5 w-5" />,
  },
  {
    value: "enterprise" as AppRole,
    label: "Enterprise",
    description: "Post problems and discover solutions",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    value: "investor" as AppRole,
    label: "Investor",
    description: "Discover and invest in innovations",
    icon: <TrendingUp className="h-5 w-5" />,
  },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<AuthView>(
    searchParams.get("mode") === "signup" ? "signUp" : "signIn"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingEmail, setPendingEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("innovator");

  const { signIn, user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get redirect path based on user role or returnTo param
  const getRedirectPath = useCallback((userRole: AppRole | null) => {
    const returnTo = searchParams.get("returnTo");
    if (returnTo) {
      return returnTo;
    }

    switch (userRole) {
      case "innovator":
      case "investor":
        return "/innovations";
      case "enterprise":
        return "/explore";
      default:
        return "/innovations";
    }
  }, [searchParams]);

  // If user is already authenticated and has a role (e.g., page refresh), redirect immediately
  useEffect(() => {
    if (user && role && !isNavigating) {
      console.log("[Auth] Already authenticated, redirecting to:", getRedirectPath(role));
      setIsNavigating(true);
      navigate(getRedirectPath(role));
    }
  }, [user, role, navigate, getRedirectPath, isNavigating]);

  const validateSignUpForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    const nameError = validateName(fullName);
    if (nameError) newErrors.fullName = nameError;
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, email, password]);

  const validateSignInForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    if (!password) newErrors.password = "Password is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  // Store pending signup data until verification is complete
  const [pendingSignupData, setPendingSignupData] = useState<{
    userId: string;
    role: AppRole;
  } | null>(null);

  const handleSignUp = async () => {
    if (!validateSignUpForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      // Create user with password - no email redirect to force OTP verification
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable magic link, force OTP
          data: {
            full_name: fullName,
            pending_role: selectedRole,
          },
        },
      });

      if (error) {
        console.error("[Auth] Sign up error:", error);
        const message = getAuthErrorMessage(error);
        
        if (message.toLowerCase().includes("email")) {
          setErrors({ email: message });
        } else if (message.toLowerCase().includes("password")) {
          setErrors({ password: message });
        } else {
          setErrors({ email: message });
        }
        
        toast({
          title: "Sign up failed",
          description: message,
          variant: "destructive",
        });
        return;
      }

      // Store signup data for role creation after OTP verification
      if (data.user) {
        console.log("[Auth] User created, storing pending signup data:", data.user.id);
        setPendingSignupData({
          userId: data.user.id,
          role: selectedRole,
        });
      }

      // Email confirmation required - show OTP verification UI
      if (data.user && !data.session) {
        console.log("[Auth] Email confirmation required, showing OTP verification");
        setPendingEmail(email);
        setView("verify");
        toast({
          title: "Check your email",
          description: "We've sent you a 6-digit verification code.",
        });
      } else if (data.session) {
        // Auto-confirmed (shouldn't happen with our config, but handle it)
        console.log("[Auth] Auto-confirmed signup, creating role");
        if (data.user) {
          await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role: selectedRole });
        }
        
        toast({
          title: "Welcome to ZYNOVEXA! 🎉",
          description: "Your account has been created successfully.",
        });
        
        const redirectPath = getRedirectPath(selectedRole);
        setIsNavigating(true);
        navigate(redirectPath);
      }
    } catch (error: any) {
      console.error("[Auth] Unexpected sign up error:", error);
      const message = getAuthErrorMessage(error);
      setErrors({ email: message });
      toast({
        title: "Something went wrong",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateSignInForm()) return;

    setIsLoading(true);
    setErrors({});
    
    console.log("[Auth] Login attempt for email:", email);
    
    try {
      // STRICT: Only use signInWithPassword - no fallbacks
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log("[Auth] Supabase signInWithPassword response:", {
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        userId: data?.user?.id ?? null,
        error: error?.message ?? null,
      });
      
      if (error) {
        console.error("[Auth] Sign in error:", error.message);
        const message = getAuthErrorMessage(error);
        
        // Check if email not verified
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          setPendingEmail(email);
          setView("verify");
          toast({
            title: "Email not verified",
            description: "Please verify your email to continue.",
            variant: "destructive",
          });
          // Resend verification OTP
          await supabase.auth.resend({ type: "signup", email });
        } else {
          // Set inline error for credentials issues
          setErrors({ 
            email: " ", // Trigger error state on email field
            password: message 
          });
          
          toast({
            title: "Sign in failed",
            description: message,
            variant: "destructive",
          });
        }
        return;
      }

      // CRITICAL: Block if no user returned
      if (!data.user || !data.session) {
        console.error("[Auth] BLOCKED: Supabase returned null user or session");
        setErrors({ password: "Authentication failed. Please try again." });
        toast({
          title: "Authentication failed",
          description: "Unable to verify your credentials.",
          variant: "destructive",
        });
        return;
      }

      // Verify the authenticated user using getUser() as single source of truth
      const { data: verifiedUser, error: verifyError } = await supabase.auth.getUser();
      
      console.log("[Auth] Verified user from getUser():", {
        userId: verifiedUser?.user?.id ?? null,
        email: verifiedUser?.user?.email ?? null,
        emailConfirmedAt: verifiedUser?.user?.email_confirmed_at ?? null,
        error: verifyError?.message ?? null,
      });
      
      if (verifyError || !verifiedUser.user) {
        console.error("[Auth] BLOCKED: getUser() verification failed");
        await supabase.auth.signOut();
        setErrors({ password: "Session verification failed. Please try again." });
        return;
      }

      console.log("[Auth] Login successful for user:", verifiedUser.user.id);
      
      // Fetch role directly to avoid waiting for context update
      let { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", verifiedUser.user.id)
        .maybeSingle();

      if (roleError) {
        console.error("[Auth] Error fetching role:", roleError);
      }

      let userRole = roleData?.role as AppRole | null;
      console.log("[Auth] User role from DB:", userRole);
      
      // If no role found, check user metadata for pending_role and create it
      if (!userRole) {
        const pendingRole = verifiedUser.user.user_metadata?.pending_role as AppRole | undefined;
        console.log("[Auth] No role in DB, checking metadata pending_role:", pendingRole);
        
        if (pendingRole) {
          // Create the missing role
          const { error: insertError } = await supabase
            .from("user_roles")
            .insert({ user_id: verifiedUser.user.id, role: pendingRole });
          
          if (insertError) {
            console.error("[Auth] Failed to create role:", insertError);
          } else {
            userRole = pendingRole;
            console.log("[Auth] Created role from metadata:", userRole);
          }
        }
      }
      
      // Log final session state
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("[Auth] Final session state:", {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id ?? null,
        role: userRole,
      });
      
      toast({
        title: "Welcome back!",
        description: "You've signed in successfully.",
      });

      // Determine redirect path (use role or default to /innovations)
      const redirectPath = getRedirectPath(userRole);
      console.log("[Auth] Redirecting to:", redirectPath);
      
      setIsNavigating(true);
      navigate(redirectPath);
    } catch (error: any) {
      console.error("[Auth] Unexpected sign in error:", error);
      const message = getAuthErrorMessage(error);
      setErrors({ password: message });
      toast({
        title: "Something went wrong",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === "signUp") {
      await handleSignUp();
    } else {
      await handleSignIn();
    }
  };

  const handleVerified = async () => {
    console.log("[Auth] Email verification completed, checking session...");
    
    // Verify we have a real authenticated session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    console.log("[Auth] Post-verification getUser():", {
      userId: userData?.user?.id ?? null,
      email: userData?.user?.email ?? null,
      emailConfirmedAt: userData?.user?.email_confirmed_at ?? null,
      error: userError?.message ?? null,
    });
    
    // CRITICAL: Block if no verified user
    if (userError || !userData.user) {
      console.error("[Auth] BLOCKED: No verified user after OTP verification");
      toast({
        title: "Verification failed",
        description: "Please try signing in again.",
        variant: "destructive",
      });
      setView("signIn");
      setPendingEmail("");
      setPendingSignupData(null);
      return;
    }

    // Now that email is verified, create the user role and redirect
    if (pendingSignupData) {
      try {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ 
            user_id: pendingSignupData.userId, 
            role: pendingSignupData.role 
          });

        if (roleError) {
          console.error("[Auth] Failed to set role after verification:", roleError);
        } else {
          console.log("[Auth] Role created successfully:", pendingSignupData.role);
        }

        // After OTP verification, the user is automatically signed in by Supabase
        // Check if we have a session and redirect based on the role
        const { data: sessionData } = await supabase.auth.getSession();
        
        console.log("[Auth] Post-verification session:", {
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id ?? null,
        });
        
        if (sessionData.session) {
          toast({
            title: "Welcome to ZYNOVEXA! 🎉",
            description: "Your account has been verified successfully.",
          });
          
          // Redirect based on the role we just created
          const redirectPath = getRedirectPath(pendingSignupData.role);
          console.log("[Auth] Redirecting verified user to:", redirectPath);
          setIsNavigating(true);
          navigate(redirectPath);
          return;
        }
      } catch (err) {
        console.error("[Auth] Error creating role:", err);
      }
    }

    // Fallback: If no session (shouldn't happen), ask user to sign in
    console.log("[Auth] No session found, redirecting to sign in");
    toast({
      title: "Email verified! ✓",
      description: "Please sign in to continue.",
    });
    setView("signIn");
    setPendingEmail("");
    setPendingSignupData(null);
    setPassword("");
  };

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const renderContent = () => {
    if (view === "verify") {
      return (
        <Card variant="elevated" className="border-border/50">
          <CardContent className="pt-6">
            <EmailVerification
              email={pendingEmail}
              onVerified={handleVerified}
              onBack={() => {
                setView("signUp");
                setPendingEmail("");
              }}
            />
          </CardContent>
        </Card>
      );
    }

    if (view === "forgotPassword") {
      return (
        <Card variant="elevated" className="border-border/50">
          <CardContent className="pt-6">
            <ForgotPassword
              onBack={() => setView("signIn")}
              onSuccess={() => setView("signIn")}
            />
          </CardContent>
        </Card>
      );
    }

    const isSignUp = view === "signUp";

    return (
      <Card variant="elevated" className="border-border/50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">{isSignUp ? "Create your account" : "Welcome back"}</CardTitle>
          <CardDescription className="text-base">
            {isSignUp ? "Join the global innovation platform" : "Sign in to access your dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <>
                <FormField
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) clearErrors();
                  }}
                  placeholder="John Doe"
                  disabled={isLoading || isNavigating}
                  error={errors.fullName}
                  autoComplete="name"
                  autoFocus
                />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">I am a...</Label>
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as AppRole)}
                    className="grid gap-3"
                  >
                    {roleOptions.map((option) => (
                      <Label
                        key={option.value}
                        htmlFor={option.value}
                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedRole === option.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                            selectedRole === option.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) clearErrors();
              }}
              placeholder="you@example.com"
              disabled={isLoading || isNavigating}
              error={errors.email?.trim() ? errors.email : undefined}
              autoComplete="email"
              autoFocus={!isSignUp}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setView("forgotPassword")}
                    className="text-xs text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <FormField
                label=""
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) clearErrors();
                }}
                placeholder="••••••••"
                disabled={isLoading || isNavigating}
                error={errors.password}
                showPasswordToggle
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
              {isSignUp && password && (
                <PasswordStrengthIndicator password={password} />
              )}
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              className="w-full mt-2" 
              disabled={isLoading || isNavigating}
            >
              {isNavigating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </span>
              ) : isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </span>
              ) : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setView(isSignUp ? "signIn" : "signUp");
                  clearErrors();
                  setPassword("");
                }}
                className="text-primary hover:underline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 py-1">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg glow-primary">
                <Lightbulb className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">ZYNOVEXA</span>
            </Link>
          </div>

          {renderContent()}

          {/* Security Note */}
          <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Your data is protected with enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;