import { Link } from "react-router-dom";
import { ArrowLeft, Cookie, Shield, Settings, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const Cookies = () => {
  const lastUpdated = "January 15, 2026";

  const cookieTypes = [
    {
      icon: Shield,
      title: "Essential Cookies",
      description: "Required for the website to function properly. These cannot be disabled.",
      examples: ["Session management", "Security tokens", "User authentication"],
      canDisable: false,
    },
    {
      icon: BarChart3,
      title: "Analytics Cookies",
      description: "Help us understand how visitors interact with our website.",
      examples: ["Page views", "User journey tracking", "Performance metrics"],
      canDisable: true,
    },
    {
      icon: Settings,
      title: "Functional Cookies",
      description: "Enable personalized features and remember your preferences.",
      examples: ["Language preferences", "Theme settings", "Dashboard layout"],
      canDisable: true,
    },
    {
      icon: Users,
      title: "Marketing Cookies",
      description: "Used to deliver relevant advertisements and track campaign effectiveness.",
      examples: ["Ad targeting", "Campaign attribution", "Social media integration"],
      canDisable: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <Link to="/">
              <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Cookie className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">Cookie Policy</h1>
                <p className="text-muted-foreground mt-1">Last updated: {lastUpdated}</p>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              This Cookie Policy explains how ZyNoveXa uses cookies and similar technologies 
              to recognize you when you visit our platform.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-12 text-center">
              
              {/* What are cookies */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">What Are Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies are small text files that are stored on your device (computer, tablet, or mobile) 
                  when you visit a website. They are widely used to make websites work more efficiently 
                  and to provide information to the website owners.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies allow us to recognize your device and store some information about your 
                  preferences or past actions, ultimately helping us improve your experience on our platform.
                </p>
              </div>

              {/* Types of cookies */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">Types of Cookies We Use</h2>
                <div className="grid gap-6">
                  {cookieTypes.map((cookie) => (
                    <div 
                      key={cookie.title}
                      className="p-6 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <cookie.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <h3 className="font-semibold text-foreground">{cookie.title}</h3>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              cookie.canDisable 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                                : 'bg-green-500/10 text-green-600 dark:text-green-400'
                            }`}>
                              {cookie.canDisable ? 'Optional' : 'Required'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{cookie.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {cookie.examples.map((example) => (
                              <span 
                                key={example}
                                className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                              >
                                {example}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Managing cookies */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Managing Your Cookie Preferences</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to decide whether to accept or reject cookies. You can manage 
                  your cookie preferences in several ways:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Browser Settings:</strong> Most web browsers allow you to control 
                    cookies through their settings. You can set your browser to refuse cookies or delete certain cookies.
                  </li>
                  <li>
                    <strong className="text-foreground">Cookie Banner:</strong> When you first visit our website, you can 
                    choose which types of cookies to accept through our cookie consent banner.
                  </li>
                  <li>
                    <strong className="text-foreground">Platform Settings:</strong> Logged-in users can manage their 
                    preferences through their account settings.
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Please note that if you choose to block certain cookies, some features of our platform may 
                  not function as intended.
                </p>
              </div>

              {/* Third-party cookies */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Third-Party Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  In addition to our own cookies, we may also use various third-party cookies to report 
                  usage statistics of the platform and deliver advertisements on and through the platform.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  These third-party services include analytics providers (to help us understand how our 
                  platform is used) and advertising partners (to deliver relevant advertisements).
                </p>
              </div>

              {/* Updates */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Updates to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in our practices 
                  or for other operational, legal, or regulatory reasons. We encourage you to periodically 
                  review this page for the latest information on our cookie practices.
                </p>
              </div>

              {/* Contact */}
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-3">Questions About Cookies?</h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about our use of cookies or this Cookie Policy, please contact us.
                </p>
                <Link to="/contact">
                  <Button>Contact Us</Button>
                </Link>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Cookies;