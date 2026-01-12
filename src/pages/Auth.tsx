import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, ArrowLeft, Building2, Rocket, TrendingUp, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { AppRole } from "@/types";
import { z } from "zod";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["innovator", "enterprise", "investor"] as const),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

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
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("innovator");

  const { signUp, signIn, user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get redirect path based on user role or returnTo param
  const getRedirectPath = (userRole: AppRole | null) => {
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
  };

  useEffect(() => {
    if (user && role) {
      setIsNavigating(true);
      navigate(getRedirectPath(role));
    }
  }, [user, role, navigate, searchParams]);

  const validateForm = () => {
    try {
      if (isSignUp) {
        signUpSchema.parse({ fullName, email, password, role: selectedRole });
      } else {
        signInSchema.parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "An account with this email already exists. Please sign in.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome to ZYNOVEXA!",
            description: "Your account has been created successfully.",
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col justify-between">
      {/* Header */}
      <header className="p-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
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
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg glow-primary">
                <Lightbulb className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">ZYNOVEXA</span>
            </Link>
          </div>

          <Card variant="elevated" className="border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{isSignUp ? "Create your account" : "Welcome back"}</CardTitle>
              <CardDescription>
                {isSignUp ? "Join the global innovation platform" : "Sign in to access your dashboard"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        disabled={isLoading || isNavigating}
                      />
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label>I am a...</Label>
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
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
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

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading || isNavigating}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading || isNavigating}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading || isNavigating}>
                  {isNavigating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting...
                    </span>
                  ) : isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Please wait...
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
                      setIsSignUp(!isSignUp);
                      setErrors({});
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Note */}
          <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" />
            Your data is protected with enterprise-grade security
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
