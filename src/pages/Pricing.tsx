import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Perfect for individuals and small teams",
    price: "Free",
    period: "",
    features: [
      "Up to 3 problem posts",
      "Basic AI matching",
      "Community support",
      "Public solution submissions",
    ],
    cta: "Get Started",
    variant: "outline" as const,
  },
  {
    name: "Professional",
    description: "For growing organizations",
    price: "$99",
    period: "/month",
    features: [
      "Unlimited problem posts",
      "Advanced AI matching",
      "Priority support",
      "Private challenges",
      "Team collaboration",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large-scale innovation",
    price: "Custom",
    period: "",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantees",
      "Advanced security",
      "White-label options",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Pricing
            </Badge>
            <h1 className="hero-heading mb-6">
              Simple, Transparent
              <span className="text-gradient-primary block">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your innovation needs. Start free, scale as you grow.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={plan.name}
                variant={plan.popular ? "highlight" : "interactive"}
                className={`relative animate-fade-in ${plan.popular ? "scale-105" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="px-4">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.variant} className="w-full" asChild>
                    <Link to="/auth?mode=signup">
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
