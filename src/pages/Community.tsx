import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  MessageSquare, 
  Calendar,
  ExternalLink,
  Github,
  Twitter
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

const communityChannels = [
  {
    icon: MessageSquare,
    title: "Community Forum",
    description: "Join discussions, ask questions, and share your experiences with other ZyNoveXa users.",
    link: "#",
    linkText: "Visit Forum",
    members: "5,200+",
  },
  {
    icon: Users,
    title: "Discord Server",
    description: "Real-time chat with the community. Get help, share ideas, and connect with innovators.",
    link: "#",
    linkText: "Join Discord",
    members: "3,800+",
  },
  {
    icon: Calendar,
    title: "Community Events",
    description: "Webinars, workshops, and networking events for innovators, enterprises, and investors.",
    link: "#",
    linkText: "View Events",
    upcoming: "3 events",
  },
];

const socialLinks = [
  { icon: Twitter, name: "X (Twitter)", handle: "@zynovexa", link: "https://x.com/zynovexa" },
  { icon: Github, name: "GitHub", handle: "zynovexa", link: "https://github.com/zynovexa" },
];

export default function Community() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Users className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Join Our Community
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Connect with innovators, enterprises, and investors from around the world. 
            Share ideas, get support, and grow together.
          </p>
        </div>
      </section>

      {/* Community Channels */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
            Ways to Connect
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {communityChannels.map((channel) => (
              <Card key={channel.title} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="p-3 rounded-full bg-primary/10 w-fit mb-3">
                    <channel.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{channel.title}</CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">
                      {channel.members ? `${channel.members} members` : channel.upcoming}
                    </span>
                  </div>
                  <Button className="w-full" variant="outline">
                    {channel.linkText}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-8">
            Follow Us
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <social.icon className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{social.name}</p>
                  <p className="text-sm text-muted-foreground">{social.handle}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Community Guidelines</CardTitle>
              <CardDescription>
                Help us maintain a welcoming and productive community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Be Respectful</h3>
                  <p className="text-sm text-muted-foreground">
                    Treat all community members with respect. Healthy debate is welcome, but personal attacks are not.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Stay On Topic</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep discussions relevant to innovation, technology, and the ZyNoveXa platform.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Share Knowledge</h3>
                  <p className="text-sm text-muted-foreground">
                    Help others by sharing your experiences and expertise. We grow stronger together.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Protect Privacy</h3>
                  <p className="text-sm text-muted-foreground">
                    Respect the privacy of others. Don't share personal information without consent.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
