import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, ArrowLeft, Building2, Rocket, TrendingUp, Shield, Loader2 } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
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

  useEffect(() => {
    if (user && role) {
      setIsNavigating(true);
      navigate(getRedirectPath(role));
    }
  }, [user, role, navigate, getRedirectPath]);

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

  const handleSignUp = async () => {
    if (!validateSignUpForm()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        const message = getAuthErrorMessage(error);
        
        // Set inline error for specific cases
        if (message.includes("email")) {
          setErrors({ email: message });
        } else if (message.includes("password")) {
          setErrors({ password: message });
        }
        
        toast({
          title: "Sign up failed",
          description: message,
          variant: "destructive",
        });
        return;
      }

      // Store role in user_roles table
      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: selectedRole });

        if (roleError) {
          console.error("Failed to set role:", roleError);
        }
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        setPendingEmail(email);
        setView("verify");
        toast({
          title: "Check your email",
          description: "We've sent you a verification code to confirm your email address.",
        });
      } else if (data.session) {
        // Auto-confirmed (dev mode or auto-confirm enabled)
        toast({
          title: "Welcome to ZYNOVEXA! 🎉",
          description: "Your account has been created successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateSignInForm()) return;

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
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
          // Resend verification code
          await supabase.auth.resend({ type: "signup", email });
        } else {
          // Set inline error
          if (message.includes("email") || message.includes("password") || message.includes("credentials")) {
            setErrors({ 
              email: " ", // Empty space to trigger error state
              password: message 
            });
          }
          
          toast({
            title: "Sign in failed",
            description: message,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: getAuthErrorMessage(error),
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

  const handleVerified = () => {
    toast({
      title: "Email verified! ✓",
      description: "You can now sign in to your account.",
    });
    setView("signIn");
    setPendingEmail("");
    // Clear form for fresh sign in
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
    <div className="min-h-screen bg-gradient-hero flex flex-col justify-between">
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

      <Footer />
    </div>
  );
};

export default Auth;