import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  Lock, 
  Upload, 
  Eye,
  CheckCircle2
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

const troubleshootingGuides = [
  {
    icon: Wifi,
    title: "Connection Issues",
    description: "Having trouble connecting to Zynovexa?",
    steps: [
      "Check your internet connection",
      "Clear your browser cache and cookies",
      "Try a different browser or incognito mode",
      "Disable browser extensions that might interfere",
      "If the issue persists, contact support",
    ],
  },
  {
    icon: Lock,
    title: "Login Problems",
    description: "Can't access your account?",
    steps: [
      "Verify your email address is correct",
      "Use the 'Forgot Password' link to reset your password",
      "Check if your account has been verified",
      "Ensure caps lock is not enabled",
      "Try logging in from a different device",
    ],
  },
  {
    icon: Upload,
    title: "Upload Failures",
    description: "Files not uploading correctly?",
    steps: [
      "Check file size limits (max 10MB for images, 50MB for videos)",
      "Ensure file format is supported (JPG, PNG, PDF, MP4)",
      "Try compressing large files before upload",
      "Check your internet connection stability",
      "Try uploading one file at a time",
    ],
  },
  {
    icon: Eye,
    title: "Content Not Displaying",
    description: "Pages or content not loading?",
    steps: [
      "Refresh the page using Ctrl/Cmd + R",
      "Clear browser cache",
      "Check if JavaScript is enabled in your browser",
      "Disable ad blockers for this site",
      "Try accessing from a different browser",
    ],
  },
  {
    icon: RefreshCw,
    title: "Sync Issues",
    description: "Changes not saving or syncing?",
    steps: [
      "Wait a few seconds and refresh the page",
      "Check if you're logged into the correct account",
      "Verify you have edit permissions",
      "Try logging out and back in",
      "Contact support if data seems lost",
    ],
  },
];

export default function Troubleshooting() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-destructive/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Troubleshooting Guide
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Common issues and how to fix them. Follow the steps below to resolve problems quickly.
          </p>
        </div>
      </section>

      {/* Guides */}
      <section className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-6">
            {troubleshootingGuides.map((guide) => (
              <Card key={guide.title} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10 shrink-0">
                      <guide.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{guide.title}</CardTitle>
                      <CardDescription>{guide.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 ml-4">
                    {guide.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
