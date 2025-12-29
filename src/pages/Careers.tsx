import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Heart,
  Zap,
  Globe,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const benefits = [
  { icon: <Heart className="h-5 w-5" />, title: "Health & Wellness", description: "Comprehensive health coverage" },
  { icon: <Zap className="h-5 w-5" />, title: "Learning Budget", description: "Annual learning & development fund" },
  { icon: <Globe className="h-5 w-5" />, title: "Remote First", description: "Work from anywhere in the world" },
  { icon: <Users className="h-5 w-5" />, title: "Great Team", description: "Collaborative, inclusive culture" },
];

const Careers = () => {
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
              <Briefcase className="h-3 w-3 mr-1.5" />
              Careers
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Join the
              <span className="text-gradient-primary block">Innovation Revolution</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Help us build the future of how the world solves problems. We're always looking for talented people.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Why Work With Us</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card
                key={benefit.title}
                variant="interactive"
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Open Positions Coming Soon</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            We're preparing to grow our team. Leave your email to be notified when positions open up.
          </p>
          <Button variant="hero" asChild>
            <Link to="/contact">
              Get in Touch
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
