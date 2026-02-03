import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  Lightbulb, 
  ArrowRight,
  Search 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { useState } from "react";

const helpTopics = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Learn the basics of using Zynovexa platform",
    link: "/faqs",
  },
  {
    icon: Lightbulb,
    title: "Submit Innovation",
    description: "How to share your innovative solutions",
    link: "/dashboard/innovations",
  },
  {
    icon: MessageSquare,
    title: "Connect with Investors",
    description: "Tips for engaging with potential investors",
    link: "/faqs",
  },
  {
    icon: HelpCircle,
    title: "Account & Settings",
    description: "Manage your profile and preferences",
    link: "/dashboard/settings",
  },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How can we help you?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Find answers, get support, and learn how to make the most of Zynovexa.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-card border-border"
            />
          </div>
        </div>
      </section>

      {/* Help Topics */}
      <section className="flex-1 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
            Popular Help Topics
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {helpTopics.map((topic) => (
              <Card key={topic.title} className="bg-card border-border hover:border-primary/50 transition-colors group">
                <CardHeader>
                  <div className="p-3 rounded-full bg-primary/10 w-fit mb-3">
                    <topic.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={topic.link}>
                    <Button variant="ghost" className="p-0 h-auto text-primary group-hover:gap-3 transition-all">
                      Learn more <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Support CTA */}
          <div className="mt-16 text-center">
            <Card className="bg-card border-border max-w-2xl mx-auto">
              <CardContent className="py-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Still need help?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our support team is here to assist you with any questions.
                </p>
                <Link to="/contact">
                  <Button>Contact Support</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
