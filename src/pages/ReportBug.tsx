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
import { Bug, Send, Loader2, CheckCircle } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { toast } from "sonner";

export default function ReportBug() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    severity: "",
    description: "",
    steps: "",
    expected: "",
    actual: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.severity || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Bug report submitted successfully!");
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <section className="flex-1 flex items-center justify-center py-16">
          <Card className="bg-card border-border max-w-md w-full mx-4">
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-green-500/10">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Thank You!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your bug report has been submitted. Our team will investigate and get back to you if needed.
              </p>
              <Button onClick={() => setIsSubmitted(false)}>
                Submit Another Report
              </Button>
            </CardContent>
          </Card>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-destructive/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-destructive/10">
              <Bug className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Report a Bug
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Found something not working correctly? Help us improve by reporting the issue.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Bug Report Form</CardTitle>
              <CardDescription>
                Please provide as much detail as possible to help us identify and fix the issue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Bug Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the bug"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                      <SelectItem value="medium">Medium - Affects usability</SelectItem>
                      <SelectItem value="high">High - Major feature broken</SelectItem>
                      <SelectItem value="critical">Critical - App unusable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the bug in detail..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="steps">Steps to Reproduce</Label>
                  <Textarea
                    id="steps"
                    placeholder="1. Go to...\n2. Click on...\n3. See error..."
                    rows={3}
                    value={formData.steps}
                    onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected">Expected Behavior</Label>
                    <Textarea
                      id="expected"
                      placeholder="What should happen?"
                      rows={2}
                      value={formData.expected}
                      onChange={(e) => setFormData({ ...formData, expected: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual">Actual Behavior</Label>
                    <Textarea
                      id="actual"
                      placeholder="What actually happens?"
                      rows={2}
                      value={formData.actual}
                      onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
                    />
                  </div>
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
                      Submit Bug Report
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
