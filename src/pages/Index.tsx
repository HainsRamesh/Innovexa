import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Lightbulb,
  Sparkles,
  Users,
  TrendingUp,
  Building2,
  Rocket,
  Brain,
  Target,
  ArrowRight,
  Globe,
  Shield,
  Zap,
} from "lucide-react";

const stats = [
  { label: "Problems Posted", value: "2,500+" },
  { label: "Solutions Submitted", value: "12,000+" },
  { label: "Organizations", value: "850+" },
  { label: "Countries", value: "120+" },
];

const features = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: "AI-Powered Matching",
    description:
      "Our advanced AI analyzes problems and solutions to find the perfect matches based on requirements, capabilities, and context.",
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Structured Challenges",
    description:
      "Post real-world problems with clear requirements, budgets, and timelines. Get targeted solutions instead of generic proposals.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Smart Evaluation",
    description:
      "AI-assisted evaluation ranks solutions based on feasibility, innovation, and alignment with your specific needs.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global Talent Pool",
    description:
      "Access innovators, engineers, and startups from around the world ready to solve your most complex challenges.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure & Transparent",
    description:
      "Enterprise-grade security with full transparency in the evaluation process. Your IP is always protected.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Fast Time-to-Solution",
    description:
      "Streamlined workflows and AI assistance mean faster discovery and implementation of winning solutions.",
  },
];

const roles = [
  {
    title: "For Enterprises",
    description: "Post challenges and discover breakthrough solutions",
    icon: <Building2 className="h-8 w-8" />,
    benefits: ["Post structured problems", "Receive targeted solutions", "AI-ranked results"],
  },
  {
    title: "For Innovators",
    description: "Solve real problems and showcase your expertise",
    icon: <Rocket className="h-8 w-8" />,
    benefits: ["Access real challenges", "Submit solutions", "Get visibility"],
  },
  {
    title: "For Investors",
    description: "Discover high-potential innovations and teams",
    icon: <TrendingUp className="h-8 w-8" />,
    benefits: ["Track innovations", "Evaluate solutions", "Connect with teams"],
  },
];

const categories = [
  { name: "Technology", color: "technology" as const },
  { name: "Healthcare", color: "healthcare" as const },
  { name: "Sustainability", color: "sustainability" as const },
  { name: "Finance", color: "finance" as const },
  { name: "Education", color: "education" as const },
  { name: "Infrastructure", color: "infrastructure" as const },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 animate-fade-in">
              <Sparkles className="h-3 w-3 mr-1.5" />
              AI-Powered Innovation Platform
            </Badge>

            <h1
              className="hero-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.05] animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              Where Real Problems
              <br />
              <span className="bg-gradient-to-r from-primary to-[hsl(192,91%,36%)] bg-clip-text text-transparent inline-block">
                Meet Real Solutions
              </span>
            </h1>

            <p
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              INNOVEXA connects enterprises with global innovators to solve real-world challenges. AI-powered matching,
              evaluation, and discovery for breakthrough results.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  Start Innovating
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center animate-fade-in-up"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <p className="text-3xl lg:text-4xl font-bold text-gradient-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 border-y border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground mr-2">Explore:</span>
            {categories.map((category) => (
              <Badge
                key={category.name}
                variant={category.color}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Brain className="h-3 w-3 mr-1.5" />
              Platform Features
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">AI-Powered Innovation at Scale</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform leverages artificial intelligence to simplify, evaluate, match, and rank solutions—helping
              you discover innovations based on value, not marketing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                variant="interactive"
                className="group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Users className="h-3 w-3 mr-1.5" />
              For Everyone
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">One Platform, Many Possibilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're posting challenges, submitting solutions, or discovering investments— INNOVEXA provides the
              tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {roles.map((role, index) => (
              <Card
                key={role.title}
                variant="gradient"
                className="text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-8">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                    {role.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{role.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{role.description}</p>
                  <ul className="space-y-2">
                    {role.benefits.map((benefit) => (
                      <li key={benefit} className="text-sm flex items-center justify-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
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

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <Card variant="highlight" className="max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-8 lg:p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
                <Lightbulb className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Transform Innovation?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of organizations and innovators already using INNOVEXA to solve the world's most pressing
                challenges.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/auth?mode=signup">
                    Get Started Free
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/about">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
