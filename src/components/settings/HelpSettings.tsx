import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  HelpCircle,
  MessageSquare,
  Bug,
  FileText,
  Shield,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    question: 'How do I submit an innovation?',
    answer: 'Navigate to the Innovations page and click "Add Innovation". Fill in the details about your innovation including title, description, category, and upload any relevant media files.',
  },
  {
    question: 'How can I connect with investors?',
    answer: 'Publish your innovation and investors can express interest through the platform. You\'ll receive notifications when someone shows interest in your work.',
  },
  {
    question: 'What types of problems can I submit?',
    answer: 'You can submit any business or technical challenge that could benefit from innovative solutions. Categories include Technology, Healthcare, Sustainability, Finance, and more.',
  },
  {
    question: 'How do I change my account type?',
    answer: 'Currently, account types are set during registration. Contact our support team if you need to change your role from Innovator to Investor or Enterprise.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use industry-standard encryption and security practices. Your data is protected with RLS policies and secure authentication.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Security and click "Delete My Account". This action is permanent and will remove all your data from the platform.',
  },
];

export const HelpSettings = () => {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({ title: 'Message sent', description: 'We\'ll get back to you as soon as possible.' });
    setContactForm({ subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleReportBug = () => {
    toast({ 
      title: 'Report a Bug', 
      description: 'Please use the contact form below to report any bugs you encounter.' 
    });
  };

  return (
    <div className="space-y-6">
      {/* FAQ Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
              <CardDescription>Find answers to common questions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Contact Support</CardTitle>
              <CardDescription>Send us a message and we'll help you out</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={contactForm.subject}
                onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="What's this about?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Describe your issue or question..."
                rows={5}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Report Bug */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent/10">
              <Bug className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Report a Bug</CardTitle>
              <CardDescription>Help us improve by reporting issues</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleReportBug}>
            <Bug className="h-4 w-4 mr-2" />
            Report Bug
          </Button>
        </CardContent>
      </Card>

      {/* Legal Links */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Legal</CardTitle>
              <CardDescription>Terms of service and privacy policy</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/terms" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Terms of Service</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
          <Link to="/privacy" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>Privacy Policy</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
