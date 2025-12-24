import { Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { InnovationSubmissionForm } from '@/components/innovations/InnovationSubmissionForm';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function NewInnovation() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Only innovators can create innovations
  if (role !== 'innovator') {
    return <Navigate to="/innovations" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/innovations">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Innovations
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">Submit Your Innovation</h1>
            <p className="text-muted-foreground">
              Showcase your product or solution to enterprises and investors worldwide.
            </p>
          </div>

          {/* Form */}
          <InnovationSubmissionForm mode="create" />
        </div>
      </div>
    </div>
  );
}
