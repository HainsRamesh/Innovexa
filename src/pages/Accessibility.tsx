import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accessibility as AccessibilityIcon, 
  Eye, 
  Keyboard, 
  Monitor, 
  MessageCircle,
  CheckCircle2
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const accessibilityFeatures = [
  {
    icon: Keyboard,
    title: "Keyboard Navigation",
    description: "Full keyboard support for navigating the platform without a mouse.",
    features: [
      "Tab through interactive elements",
      "Arrow keys for menu navigation",
      "Enter/Space to activate buttons",
      "Escape to close modals and menus",
    ],
  },
  {
    icon: Eye,
    title: "Visual Accessibility",
    description: "Features designed for users with visual impairments.",
    features: [
      "High contrast color schemes",
      "Resizable text up to 200%",
      "Screen reader compatible",
      "Alt text for all images",
    ],
  },
  {
    icon: Monitor,
    title: "Screen Reader Support",
    description: "Optimized for popular screen reading software.",
    features: [
      "ARIA labels and landmarks",
      "Semantic HTML structure",
      "Live region announcements",
      "Descriptive link text",
    ],
  },
  {
    icon: MessageCircle,
    title: "Communication",
    description: "Clear and accessible communication features.",
    features: [
      "Clear error messages",
      "Form field instructions",
      "Status notifications",
      "Consistent navigation patterns",
    ],
  },
];

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <AccessibilityIcon className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Accessibility
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Zynovexa is committed to making our platform accessible to everyone, regardless of ability or technology.
          </p>
        </div>
      </section>

      {/* Commitment Statement */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-card border-border">
            <CardContent className="py-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Our Commitment
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We strive to ensure that Zynovexa is accessible to people with disabilities. We are continually 
                improving the user experience for everyone and applying the relevant accessibility standards.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our goal is to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. 
                These guidelines explain how to make web content more accessible for people with disabilities.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
            Accessibility Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {accessibilityFeatures.map((feature) => (
              <Card key={feature.title} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Accessibility Feedback
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                We welcome your feedback on the accessibility of Zynovexa. Please let us know if you 
                encounter accessibility barriers or have suggestions for improvement.
              </p>
              <Link to="/contact">
                <Button>Contact Us</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
