import { Link } from "react-router-dom";
import { Facebook, Twitter, Youtube, Instagram, Linkedin, Sparkles } from "lucide-react";

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "X (Twitter)" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Innovations", href: "/innovations" },
      { label: "Solutions", href: "/solutions" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "For Enterprises", href: "/about" },
      { label: "For Innovators", href: "/about" },
      { label: "For Investors", href: "/about" },
      { label: "Case Studies", href: "/blog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Blog", href: "/blog" },
      { label: "Help Center", href: "/contact" },
      { label: "Community", href: "/about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#0B1120] text-white overflow-hidden">
      {/* Teal glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top divider */}
      <div className="border-t border-white/10" />

      {/* Main Footer Content */}
      <div className="relative container mx-auto px-4 py-12 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2 group">
              <img src="/zynovexa-logo.png" alt="Zynovexa" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold tracking-tight">ZYNOVEXA</span>
            </Link>

            {/* Mission */}
            <p className="text-sm text-white/70 max-w-xs leading-relaxed">
              Connecting enterprises with global innovators to solve real-world challenges through AI-powered matching.
            </p>

            {/* Social Links */}
            <nav aria-label="Social media links">
              <ul className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105"
                      aria-label={social.label}
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Footer Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-sm text-white/60 hover:text-white transition-colors duration-200 inline-block"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
            <span>© {currentYear} Zynovexa. All rights reserved.</span>
            <nav aria-label="Legal links">
              <ul className="flex items-center gap-6">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors duration-200">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors duration-200">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors duration-200">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
