import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Clock, User, Sparkles } from "lucide-react";

const blogPosts = [
  {
    title: "The Future of Open Innovation",
    excerpt: "How AI is transforming how enterprises discover and implement breakthrough solutions.",
    author: "Innovexa Team",
    date: "Coming Soon",
    category: "Innovation",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop",
  },
  {
    title: "Building a Culture of Innovation",
    excerpt: "Strategies for fostering creativity and problem-solving across your organization.",
    author: "Innovexa Team",
    date: "Coming Soon",
    category: "Culture",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
  },
  {
    title: "AI-Powered Problem Solving",
    excerpt: "Deep dive into how machine learning matches problems with optimal solutions.",
    author: "Innovexa Team",
    date: "Coming Soon",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5">
              <BookOpen className="h-3 w-3 mr-1.5" />
              Blog
            </Badge>
            <h1 className="hero-heading mb-6">
              Insights &
              <span className="text-gradient-primary block">Innovation</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore the latest trends, strategies, and stories from the world of innovation.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {blogPosts.map((post, index) => (
              <Card
                key={post.title}
                variant="interactive"
                className="group overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.date}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Blog Coming Soon</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            We're preparing insightful content about innovation, technology, and success stories. Stay tuned!
          </p>
          <Button variant="outline" asChild>
            <Link to="/auth?mode=signup">
              Get Notified
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
