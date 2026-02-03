import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lightbulb, Send, Loader2, CheckCircle, ThumbsUp } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { toast } from "sonner";

const popularRequests = [
  { id: 1, title: "Dark/Light mode toggle", votes: 142, status: "In Progress" },
  { id: 2, title: "Mobile app for iOS and Android", votes: 128, status: "Planned" },
  { id: 3, title: "Integration with Slack", votes: 95, status: "Under Review" },
  { id: 4, title: "Export data to CSV", votes: 87, status: "Completed" },
  { id: 5, title: "Multi-language support", votes: 76, status: "Planned" },
];

export default function FeatureRequests() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    useCase: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    toast.success("Feature request submitted! Thank you for your feedback.");
    setFormData({ title: "", category: "", description: "", useCase: "" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Lightbulb className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Feature Requests
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have an idea to make Zynovexa better? We'd love to hear from you!
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Request Form */}
            <Card className="bg-card border-border h-fit">
              <CardHeader>
                <CardTitle>Submit a Feature Request</CardTitle>
                <CardDescription>
                  Tell us what you'd like to see in Zynovexa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Feature Title *</Label>
                    <Input
                      id="title"
                      placeholder="Brief title for your feature idea"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ui">User Interface</SelectItem>
                        <SelectItem value="innovation">Innovations</SelectItem>
                        <SelectItem value="matching">AI Matching</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="integration">Integrations</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the feature in detail..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="useCase">Use Case</Label>
                    <Textarea
                      id="useCase"
                      placeholder="How would you use this feature?"
                      rows={2}
                      value={formData.useCase}
                      onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Popular Requests */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Popular Requests
              </h2>
              <div className="space-y-4">
                {popularRequests.map((request) => (
                  <Card key={request.id} className="bg-card border-border">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{request.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            request.status === "Completed" 
                              ? "bg-green-500/20 text-green-400"
                              : request.status === "In Progress"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-sm font-medium">{request.votes}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
