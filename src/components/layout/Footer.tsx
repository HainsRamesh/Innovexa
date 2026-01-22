import { Link, useNavigate, useLocation } from "react-router-dom";
import { Linkedin, Twitter, Github } from "lucide-react";
import { useCallback } from "react";

// ============================================
// SOCIAL MEDIA URLs - Edit these to update your social links
// ============================================
const SOCIAL_URLS = {
  linkedin: "https://www.linkedin.com/company/zynovexa",
  twitter: "https://x.com/zynovexa",
  github: "https://github.com/zynovexa",
};

// Reusable footer link with scroll-to-top behavior
interface FooterLinkProps {
  to: string;
  children: React.ReactNode;
}

function FooterLink({ to, children }: FooterLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      
      if (location.pathname === to) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate(to);
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    },
    [to, navigate, location.pathname]
  );

  return (
    <Link
      to={to}
      onClick={handleClick}
      className="text-gray-400 hover:text-white text-sm transition-colors duration-200 focus:outline-none focus:text-primary"
    >
      {children}
    </Link>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  // Footer sections with links
  const footerSections = [
    {
      title: "Explore",
      links: [
        { label: "About Us", to: "/about" },
        { label: "Contact", to: "/contact" },
        { label: "Features", to: "/features" },
        { label: "Pricing", to: "/pricing" },
        { label: "Blog", to: "/blog" },
      ],
    },
    {
      title: "Product",
      links: [
        { label: "Road Map", to: "/roadmap" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", to: "/help-center" },
        { label: "FAQs", to: "/faqs" },
        { label: "Troubleshooting", to: "/troubleshooting" },
        { label: "Report a Bug", to: "/report-bug" },
        { label: "Feature Requests", to: "/feature-requests" },
        { label: "Accessibility", to: "/accessibility" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Community Forum", to: "/community" },
        { label: "Discord / Slack", to: "/community" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", to: "/privacy" },
        { label: "Terms of Service", to: "/terms" },
        { label: "Cookie Policy", to: "/cookies" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Linkedin, href: SOCIAL_URLS.linkedin, label: "LinkedIn" },
    { icon: Twitter, href: SOCIAL_URLS.twitter, label: "X (Twitter)" },
    { icon: Github, href: SOCIAL_URLS.github, label: "GitHub" },
  ];

  return (
    <footer className="bg-[#0B1120] border-t border-white/10" role="contentinfo">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand & Social - Takes full width on mobile, 1 column on larger */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <FooterLink to="/">
              <span className="inline-flex items-center gap-3 mb-4 group">
                <img
                  src="/zynovexa-logo.png"
                  alt=""
                  className="h-10 w-10 object-contain"
                  aria-hidden="true"
                />
                <span className="text-xl font-bold text-white tracking-tight">ZyNoveXa</span>
              </span>
            </FooterLink>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 mt-4">
              Connecting enterprises with global innovators through AI-powered
              matching and intelligent collaboration.
            </p>

            {/* Social Icons */}
            <nav aria-label="Social media links">
              <ul className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      title={social.label}
                      className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <social.icon className="w-5 h-5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Footer Link Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3" role="list">
                {section.links.map((link) => (
                  <li key={link.to + link.label}>
                    <FooterLink to={link.to}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} ZyNoveXa. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs">
              Built for innovators, by innovators.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
