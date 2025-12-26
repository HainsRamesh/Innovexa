import { Navigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { InnovationSubmissionForm } from '@/components/innovations/InnovationSubmissionForm';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Innovation } from '@/types';

export default function EditInnovation() {
  const { innovationId } = useParams<{ innovationId: string }>();
  const { user, role, isLoading: authLoading } = useAuth();

  const { data: innovation, isLoading } = useQuery({
    queryKey: ['innovation', innovationId],
    queryFn: async () => {
      if (!innovationId) throw new Error('No innovation ID');
      
      const { data, error } = await supabase
        .from('innovations')
        .select('*')
        .eq('id', innovationId)
        .single();

      if (error) throw error;
      return data as Innovation;
    },
    enabled: !!innovationId,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only innovators can edit, and only their own innovations
  if (role !== 'innovator' || (innovation && innovation.innovator_id !== user?.id)) {
    return <Navigate to="/innovations" replace />;
  }

  if (!innovation) {
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
            <h1 className="text-3xl font-bold mb-2">Edit Innovation</h1>
            <p className="text-muted-foreground">
              Update your innovation details and media.
            </p>
          </div>

          {/* Form */}
          <InnovationSubmissionForm
            mode="edit"
            initialData={{
              id: innovation.id,
              title: innovation.title,
              tagline: innovation.tagline,
              category: innovation.category,
              description: innovation.description,
              cover_image_url: innovation.cover_image_url,
              video_url: innovation.video_url || '',
              gallery_urls: innovation.gallery_urls || [],
              pdf_urls: innovation.pdf_urls || [],
              without_product: innovation.without_product,
              with_product: innovation.with_product,
            }}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
