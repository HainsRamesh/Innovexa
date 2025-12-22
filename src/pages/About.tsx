import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  Target,
  Sparkles,
  Globe,
  Users,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <section className="text-center mb-20">
            <Badge variant="outline" className="mb-6">
              <Lightbulb className="h-3 w-3 mr-1.5" />
              About INNOVEXA
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Bridging Problems with
              <br />
              <span className="text-gradient-primary">Breakthrough Solutions</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              INNOVEXA is a global AI-powered innovation platform that connects real-world problems
              with innovators, startups, engineers, and solution creators who can solve them.
            </p>
          </section>

          {/* Mission */}
          <section className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4">
                  <Target className="h-3 w-3 mr-1.5" />
                  Our Mission
                </Badge>
                <h2 className="text-3xl font-bold mb-6">
                  Democratizing Innovation for the World's Toughest Challenges
                </h2>
                <p className="text-muted-foreground mb-6">
                  We believe that the best solutions often come from unexpected places. By creating an
                  open platform where enterprises, governments, and institutions can share their
                  challenges, we unlock the potential of global talent to solve problems that matter.
                </p>
                <p className="text-muted-foreground">
                  Our AI-powered matching and evaluation systems ensure that solutions are discovered
                  based on their merit and relevance—not marketing budgets or existing relationships.
                </p>
              </div>
              <Card variant="gradient" className="p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gradient-primary">2,500+</p>
                    <p className="text-sm text-muted-foreground">Problems Posted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gradient-primary">12,000+</p>
                    <p className="text-sm text-muted-foreground">Solutions Submitted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gradient-primary">850+</p>
                    <p className="text-sm text-muted-foreground">Organizations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gradient-primary">120+</p>
                    <p className="text-sm text-muted-foreground">Countries</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Sparkles className="h-3 w-3 mr-1.5" />
                How It Works
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Simple, Powerful, Effective</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform streamlines the entire innovation process, from problem definition to
                solution implementation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Post Your Challenge',
                  description:
                    'Enterprises and organizations post structured problems with clear requirements, budgets, and timelines.',
                  icon: <Target className="h-6 w-6" />,
                },
                {
                  step: '02',
                  title: 'AI Matches Solutions',
                  description:
                    'Our AI analyzes submissions and matches them to problems based on feasibility, innovation, and alignment.',
                  icon: <Sparkles className="h-6 w-6" />,
                },
                {
                  step: '03',
                  title: 'Discover & Implement',
                  description:
                    'Review ranked solutions, connect with innovators, and implement breakthrough ideas.',
                  icon: <Zap className="h-6 w-6" />,
                },
              ].map((item) => (
                <Card key={item.step} variant="interactive">
                  <CardContent className="p-8">
                    <div className="text-4xl font-bold text-primary/20 mb-4">{item.step}</div>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Values */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Shield className="h-3 w-3 mr-1.5" />
                Our Values
              </Badge>
              <h2 className="text-3xl font-bold mb-4">What We Stand For</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Merit-Based',
                  description: 'Solutions are judged on quality and impact, not marketing.',
                  icon: <TrendingUp className="h-5 w-5" />,
                },
                {
                  title: 'Global Access',
                  description: 'Innovation knows no borders. We connect talent worldwide.',
                  icon: <Globe className="h-5 w-5" />,
                },
                {
                  title: 'Transparency',
                  description: 'Clear evaluation criteria and open communication.',
                  icon: <Users className="h-5 w-5" />,
                },
                {
                  title: 'Security',
                  description: 'Enterprise-grade protection for your IP and data.',
                  icon: <Shield className="h-5 w-5" />,
                },
              ].map((value) => (
                <Card key={value.title}>
                  <CardContent className="p-6 text-center">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                      {value.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section>
            <Card variant="highlight" className="text-center">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">Ready to Join the Innovation Revolution?</h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Whether you have problems to solve or solutions to offer, INNOVEXA is your platform
                  for meaningful impact.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button variant="hero" size="xl" asChild>
                    <Link to="/auth?mode=signup">
                      Get Started
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="xl" asChild>
                    <Link to="/explore">Browse Problems</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 INNOVEXA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;
