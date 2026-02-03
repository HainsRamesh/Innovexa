import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/layout/Footer";
import { useState, useMemo } from "react";

const faqCategories = [
  {
    category: "Getting Started",
    faqs: [
      {
        question: "What is Zynovexa?",
        answer: "Zynovexa is an AI-powered platform that connects enterprises with global innovators to solve real-world challenges through intelligent matching and collaboration.",
      },
      {
        question: "How do I create an account?",
        answer: "Click the 'Sign Up' button on the homepage, enter your email and create a password. You can then complete your profile and choose your role as an Innovator, Enterprise, or Investor.",
      },
      {
        question: "Is Zynovexa free to use?",
        answer: "Zynovexa offers both free and premium tiers. Basic features are available at no cost, while advanced features like AI-powered matching and priority support require a subscription.",
      },
    ],
  },
  {
    category: "For Innovators",
    faqs: [
      {
        question: "How do I submit an innovation?",
        answer: "Navigate to your Dashboard, click 'My Innovations', then 'Add Innovation'. Fill in the details including title, description, category, and upload any relevant media or documentation.",
      },
      {
        question: "How can I get noticed by investors?",
        answer: "Complete your innovation profile thoroughly, add compelling visuals and demos, and keep your content up-to-date. Innovations with complete profiles receive 3x more views.",
      },
      {
        question: "Can I protect my intellectual property?",
        answer: "Yes, you can mark innovations as private and require NDA acceptance before sharing detailed information with interested parties.",
      },
    ],
  },
  {
    category: "For Enterprises",
    faqs: [
      {
        question: "How do I post a problem statement?",
        answer: "Go to your Dashboard, select 'My Problems', and click 'Post New Problem'. Describe your challenge, set requirements, and optionally add a budget range.",
      },
      {
        question: "How does the AI matching work?",
        answer: "Our AI analyzes your problem requirements and matches them with relevant innovations and solutions based on technology, industry, and capability alignment.",
      },
    ],
  },
  {
    category: "Account & Security",
    faqs: [
      {
        question: "How do I change my password?",
        answer: "Go to Settings > Security and click 'Change Password'. You'll need to enter your current password and then your new password twice for confirmation.",
      },
      {
        question: "How do I delete my account?",
        answer: "Navigate to Settings > Security and click 'Delete My Account'. This action is permanent and will remove all your data from the platform.",
      },
      {
        question: "Is my data secure?",
        answer: "Yes, we use industry-standard encryption, secure authentication, and row-level security policies to protect your data.",
      },
    ],
  },
];

export default function FAQs() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;

    const query = searchQuery.toLowerCase();
    return faqCategories
      .map((category) => ({
        ...category,
        faqs: category.faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.faqs.length > 0);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <HelpCircle className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Find quick answers to common questions about Zynovexa.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-card border-border"
            />
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {filteredCategories.length === 0 ? (
            <p className="text-center text-muted-foreground text-lg">
              No FAQs found matching your search.
            </p>
          ) : (
            <div className="space-y-8">
              {filteredCategories.map((category) => (
                <Card key={category.category} className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-xl">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`${category.category}-${index}`}>
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
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
