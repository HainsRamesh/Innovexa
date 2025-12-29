import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5">
              <FileText className="h-3 w-3 mr-1.5" />
              Legal
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-invert">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Innovexa, you agree to be bound by these Terms of Service
              and all applicable laws and regulations.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily access the materials on Innovexa for personal,
              non-commercial transitory viewing only.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password.
              You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h2>4. User Content</h2>
            <p>
              You retain ownership of content you submit. By submitting content, you grant us a
              license to use, display, and distribute your content in connection with our services.
            </p>

            <h2>5. Intellectual Property</h2>
            <p>
              The platform and its original content, features, and functionality are owned by
              Innovexa and are protected by international copyright and trademark laws.
            </p>

            <h2>6. Prohibited Uses</h2>
            <p>
              You may not use our services for any unlawful purpose, to solicit others to perform
              unlawful acts, or to violate any regulations.
            </p>

            <h2>7. Disclaimer</h2>
            <p>
              The materials on Innovexa are provided on an 'as is' basis. We make no warranties,
              expressed or implied, and hereby disclaim all other warranties.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
              In no event shall Innovexa or its suppliers be liable for any damages arising out of
              the use or inability to use our services.
            </p>

            <h2>9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective
              immediately upon posting to the website.
            </p>

            <h2>10. Contact</h2>
            <p>
              Questions about the Terms of Service should be sent to legal@innovexa.com.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
