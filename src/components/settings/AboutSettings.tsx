import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import {
  Info,
  Rocket,
  Heart,
  Globe,
  Code,
  ExternalLink,
} from 'lucide-react';

export const AboutSettings = () => {
  const appVersion = '1.0.0';
  const buildDate = '2024';

  return (
    <div className="space-y-6">
      {/* App Info */}
      <Card className="bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center">
              <Rocket className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Zynovexa</CardTitle>
          <CardDescription>Connecting Innovations with Opportunities</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="secondary">Version {appVersion}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            © {buildDate} Zynovexa. All rights reserved.
          </p>
        </CardContent>
      </Card>

      {/* Mission */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Our Mission</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Zynovexa is dedicated to bridging the gap between innovative ideas and the resources 
            they need to flourish. We connect innovators, enterprises, and investors to solve 
            real-world problems through collaboration and cutting-edge solutions.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Code className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Key Features</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <span className="text-muted-foreground">Submit and discover innovative solutions</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <span className="text-muted-foreground">Connect with investors and enterprises</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <span className="text-muted-foreground">Real-time messaging and collaboration</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <span className="text-muted-foreground">Comprehensive dashboard analytics</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <span className="text-muted-foreground">Secure privacy and data protection</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Links</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/about" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span>About Us</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
          <Separator />
          <Link to="/features" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3">
              <Rocket className="h-4 w-4 text-muted-foreground" />
              <span>Features</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
          <Separator />
          <Link to="/careers" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span>Careers</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
          <Separator />
          <Link to="/contact" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>Contact</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </CardContent>
      </Card>

      {/* Credits */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>Made with ❤️ by the Zynovexa Team</p>
      </div>
    </div>
  );
};
