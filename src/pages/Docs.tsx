import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Rocket,
  Code2,
  FileText,
  Video,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const docCategories = [
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "Getting Started",
    description: "Quick start guides and tutorials to get you up and running.",
    link: "#getting-started",
  },
  {
    icon: <Code2 className="h-6 w-6" />,
    title: "API Reference",
    description: "Complete API documentation for developers and integrations.",
    link: "#api",
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "User Guides",
    description: "Step-by-step guides for all platform features.",
    link: "#guides",
  },
  {
    icon: <Video className="h-6 w-6" />,
    title: "Video Tutorials",
    description: "Watch and learn with our video tutorial library.",
    link: "#videos",
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Best Practices",
    description: "Learn how to get the most out of the platform.",
    link: "#best-practices",
  },
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "Community",
    description: "Join discussions and get help from the community.",
    link: "#community",
  },
];

const Docs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5">
              <BookOpen className="h-3 w-3 mr-1.5" />
              Documentation
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Learn How to
              <span className="text-gradient-primary block">Use Innovexa</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Comprehensive guides, tutorials, and API documentation to help you succeed.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="#getting-started">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Quick Start
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {docCategories.map((category, index) => (
              <Card
                key={category.title}
                variant="interactive"
                className="group cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                  <span className="text-sm text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Explore
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-4">Coming Soon</Badge>
          <h2 className="text-2xl font-bold mb-4">Full Documentation in Development</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We're working on comprehensive documentation. In the meantime, reach out to our support team for any questions.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Docs;
