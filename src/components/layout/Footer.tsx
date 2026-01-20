import { Link } from "react-router-dom";
import { useState } from "react";
import { 
  Facebook, 
  Twitter, 
  Youtube, 
  Instagram, 
  Linkedin, 
  Github,
  Mail,
  ArrowRight,
  Shield,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ============================================
// SOCIAL MEDIA URLs - Edit these to update your social links
// ============================================
const SOCIAL_URLS = {
  facebook: "https://facebook.com/zynovexa",
  twitter: "https://x.com/zynovexa",
  youtube: "https://youtube.com/@zynovexa",
  instagram: "https://instagram.com/zynovexa",
  linkedin: "https://www.linkedin.com/company/zynovexa",
  github: "https://github.com/zynovexa",
};

// ============================================
// Social Links Configuration
// ============================================
const socialLinks = [
  { icon: Linkedin, href: SOCIAL_URLS.linkedin, label: "LinkedIn", title: "Connect with us on LinkedIn" },
  { icon: Github, href: SOCIAL_URLS.github, label: "GitHub", title: "View our open source projects" },
  { icon: Twitter, href: SOCIAL_URLS.twitter, label: "X (Twitter)", title: "Follow us on X" },
  { icon: Youtube, href: SOCIAL_URLS.youtube, label: "YouTube", title: "Subscribe to our channel" },
  { icon: Instagram, href: SOCIAL_URLS.instagram, label: "Instagram", title: "Follow us on Instagram" },
  { icon: Facebook, href: SOCIAL_URLS.facebook, label: "Facebook", title: "Like us on Facebook" },
];

// ============================================
// Footer Navigation Structure
// ============================================
const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press & Media", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "Partners", href: "/about" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Innovations", href: "/innovations" },
      { label: "Solutions", href: "/solutions" },
      { label: "Explore Problems", href: "/explore" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/docs" },
      { label: "Blog", href: "/blog" },
      { label: "Case Studies", href: "/blog" },
      { label: "Help Center", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/contact" },
      { label: "Community Forum", href: "/about" },
      { label: "System Status", href: "/docs" },
      { label: "Report a Bug", href: "/contact" },
      { label: "Feature Request", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/privacy" },
      { label: "Security", href: "/privacy" },
      { label: "GDPR Compliance", href: "/privacy" },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsSubscribing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Thanks for subscribing! Check your inbox for confirmation.");
    setEmail("");
    setIsSubscribing(false);
  };

  return (
    <footer className="relative bg-[#0B1120] text-white overflow-hidden" role="contentinfo">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      {/* Top divider */}
      <div className="border-t border-white/10" aria-hidden="true" />

      {/* Newsletter Section */}
      <div className="relative border-b border-white/10">
        <div className="container mx-auto px-4 py-10 md:py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-md">
              <h3 className="text-lg font-semibold text-white mb-2">Stay in the loop</h3>
              <p className="text-sm text-white/60">
                Get the latest updates on innovations, product news, and industry insights delivered to your inbox.
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex w-full lg:w-auto gap-3">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <Input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full lg:w-72 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50"
                aria-describedby="newsletter-description"
              />
              <span id="newsletter-description" className="sr-only">Subscribe to our newsletter for updates</span>
              <Button 
                type="submit" 
                disabled={isSubscribing}
                className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubscribing ? (
                  "Subscribing..."
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center group" aria-label="Zynovexa Home">
              <img 
                src="/zynovexa-logo.png" 
                alt="" 
                className="h-12 w-12 object-contain" 
                aria-hidden="true"
              />
              <span className="text-xl font-bold tracking-tight">ZYNOVEXA</span>
            </Link>

            {/* Mission Statement */}
            <p className="text-sm text-white/70 max-w-xs leading-relaxed">
              Connecting enterprises with global innovators to solve real-world challenges through AI-powered matching and intelligent collaboration.
            </p>

            {/* Social Links */}
            <nav aria-label="Social media links">
              <ul className="flex items-center gap-2 flex-wrap">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[#0B1120]"
                      aria-label={social.label}
                      title={social.title}
                    >
                      <social.icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Trust Badges */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Shield className="h-4 w-4 text-primary/70" aria-hidden="true" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Lock className="h-4 w-4 text-primary/70" aria-hidden="true" />
                <span>GDPR Ready</span>
              </div>
            </div>
          </div>

          {/* Footer Navigation Columns */}
          <nav className="lg:col-span-9" aria-label="Footer navigation">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">
                    {column.title}
                  </h4>
                  <ul className="space-y-3" role="list">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.href}
                          className="text-sm text-white/60 hover:text-white transition-colors duration-200 inline-block focus:outline-none focus:text-primary"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-white/50 text-center md:text-left">
              © {currentYear} Zynovexa, Inc. All rights reserved.
            </p>

            {/* Bottom Links */}
            <nav aria-label="Legal links">
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors duration-200 focus:outline-none focus:text-primary">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors duration-200 focus:outline-none focus:text-primary">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors duration-200 focus:outline-none focus:text-primary">
                    Cookies
                  </Link>
                </li>
                <li>
                  <a 
                    href={`mailto:support@zynovexa.com`}
                    className="hover:text-white transition-colors duration-200 inline-flex items-center gap-1.5 focus:outline-none focus:text-primary"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    Contact
                  </a>
                </li>
              </ul>
            </nav>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
