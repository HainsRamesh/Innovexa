import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Map, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Rocket
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

const roadmapItems = [
  {
    quarter: "Q1 2025",
    status: "completed",
    items: [
      { title: "AI-Powered Innovation Matching", description: "Smart algorithm to match innovations with enterprise needs", tag: "AI" },
      { title: "Investor Interest System", description: "Allow investors to express interest in innovations", tag: "Core" },
      { title: "Real-time Messaging", description: "Direct communication between users", tag: "Communication" },
      { title: "Dashboard Analytics", description: "Comprehensive metrics for all user roles", tag: "Analytics" },
    ],
  },
  {
    quarter: "Q2 2025",
    status: "in-progress",
    items: [
      { title: "Mobile App (iOS & Android)", description: "Native mobile experience for on-the-go access", tag: "Mobile" },
      { title: "Advanced Search Filters", description: "Filter by technology, industry, and more", tag: "Search" },
      { title: "Video Pitch Support", description: "Upload and showcase video presentations", tag: "Media" },
      { title: "Collaboration Workspaces", description: "Shared spaces for team collaboration", tag: "Collaboration" },
    ],
  },
  {
    quarter: "Q3 2025",
    status: "planned",
    items: [
      { title: "API for Developers", description: "Public API for third-party integrations", tag: "API" },
      { title: "Multi-language Support", description: "Platform available in 10+ languages", tag: "i18n" },
      { title: "Enterprise SSO", description: "Single sign-on for enterprise clients", tag: "Security" },
      { title: "Advanced Analytics Dashboard", description: "Deep insights with custom reports", tag: "Analytics" },
    ],
  },
  {
    quarter: "Q4 2025",
    status: "planned",
    items: [
      { title: "AI Assistant", description: "AI-powered helper for navigation and recommendations", tag: "AI" },
      { title: "Marketplace Integration", description: "Connect with external marketplaces", tag: "Integration" },
      { title: "Patent Filing Support", description: "Streamlined patent application process", tag: "Legal" },
      { title: "Community Events", description: "Virtual events and networking features", tag: "Community" },
    ],
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "in-progress":
      return <Clock className="h-5 w-5 text-blue-500" />;
    default:
      return <Sparkles className="h-5 w-5 text-muted-foreground" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "in-progress":
      return "In Progress";
    default:
      return "Planned";
  }
};

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Map className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Product Roadmap
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See what we're building and what's coming next. Our roadmap is shaped by your feedback.
          </p>
        </div>
      </section>

      {/* Roadmap Timeline */}
      <section className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            {roadmapItems.map((quarter, quarterIndex) => (
              <div key={quarter.quarter} className="relative">
                {/* Timeline line */}
                {quarterIndex < roadmapItems.length - 1 && (
                  <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-border" />
                )}
                
                {/* Quarter Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    quarter.status === "completed" 
                      ? "bg-green-500/20" 
                      : quarter.status === "in-progress"
                      ? "bg-blue-500/20"
                      : "bg-muted"
                  }`}>
                    {getStatusIcon(quarter.status)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{quarter.quarter}</h2>
                    <span className={`text-sm ${
                      quarter.status === "completed" 
                        ? "text-green-500" 
                        : quarter.status === "in-progress"
                        ? "text-blue-500"
                        : "text-muted-foreground"
                    }`}>
                      {getStatusLabel(quarter.status)}
                    </span>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="ml-16 grid md:grid-cols-2 gap-4">
                  {quarter.items.map((item) => (
                    <Card key={item.title} className="bg-card border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {item.tag}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Card className="bg-card border-border mt-12">
            <CardContent className="py-8 text-center">
              <Rocket className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Have a Feature Idea?
              </h3>
              <p className="text-muted-foreground mb-4">
                We'd love to hear your suggestions for improving Zynovexa.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
