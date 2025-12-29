import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Brain,
  Target,
  Sparkles,
  Globe,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: <Brain className="h-8 w-8" />,
    title: "AI-Powered Matching",
    description:
      "Our advanced AI analyzes problems and solutions to find perfect matches based on requirements, capabilities, and context.",
    benefits: ["Smart recommendations", "Context-aware matching", "Continuous learning"],
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "Structured Challenges",
    description:
      "Post real-world problems with clear requirements, budgets, and timelines. Get targeted solutions instead of generic proposals.",
    benefits: ["Clear problem framing", "Budget management", "Timeline tracking"],
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: "Smart Evaluation",
    description:
      "AI-assisted evaluation ranks solutions based on feasibility, innovation, and alignment with your specific needs.",
    benefits: ["Objective scoring", "Multi-criteria analysis", "Bias reduction"],
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Global Talent Pool",
    description:
      "Access innovators, engineers, and startups from around the world ready to solve your most complex challenges.",
    benefits: ["120+ countries", "Diverse expertise", "24/7 availability"],
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Secure & Transparent",
    description:
      "Enterprise-grade security with full transparency in the evaluation process. Your IP is always protected.",
    benefits: ["End-to-end encryption", "IP protection", "Audit trails"],
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Fast Time-to-Solution",
    description:
      "Streamlined workflows and AI assistance mean faster discovery and implementation of winning solutions.",
    benefits: ["Rapid prototyping", "Quick iterations", "Fast deployment"],
  },
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Platform Features
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Powerful Features for
              <span className="text-gradient-primary block">Innovation at Scale</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Everything you need to discover, evaluate, and implement breakthrough solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                variant="interactive"
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of organizations already transforming how they innovate.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/auth?mode=signup">
              Start Free Trial
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;
