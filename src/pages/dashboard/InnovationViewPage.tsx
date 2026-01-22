import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Play, Heart, Edit, Calendar } from 'lucide-react';
import { Innovation } from '@/types';
import { getCategoryColor, getCategoryLabel } from '@/lib/categoryColors';
import { format } from 'date-fns';
import { useDemoPlayTracker } from '@/hooks/useDemoPlayTracker';
import { VideoThumbnailPlayer } from '@/components/innovations/VideoThumbnailPlayer';

const InnovationViewPage = () => {
  const { innovationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [innovation, setInnovation] = useState<Innovation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewCount, setViewCount] = useState(0);

  const navigationState = location.state as { returnTo?: string; from?: string } | null;
  const returnTo = navigationState?.returnTo;
  const fromLocation = navigationState?.from;
  const { trackDemoPlay } = useDemoPlayTracker(innovationId || '');

  useEffect(() => {
    if (innovationId) {
      fetchInnovation();
    }
  }, [innovationId]);

  const fetchInnovation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('innovations')
        .select('*')
        .eq('id', innovationId)
        .single();

      if (error) throw error;
      const innovationData = data as Innovation;
      setInnovation(innovationData);
      setViewCount(innovationData.view_count || 0);
    } catch (error) {
      console.error('Error fetching innovation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoPlay = useCallback(() => {
    trackDemoPlay();
    setViewCount((prev) => prev + 1);
  }, [trackDemoPlay]);

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }

    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!innovation) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-semibold mb-2">Innovation not found</h2>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === innovation.innovator_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {isOwner && (
          <Button onClick={() => navigate(`/dashboard/innovations/${innovation.id}/edit`, { state: { from: fromLocation } })}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Innovation
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Image */}
          <Card className="overflow-hidden">
            <div className="aspect-video relative">
              <img 
                src={innovation.cover_image_url} 
                alt={innovation.title}
                className="w-full h-full object-cover"
              />
              <Badge 
                className={`absolute top-4 left-4 ${getCategoryColor(innovation.category, 'innovation')}`}
              >
                {getCategoryLabel(innovation.category, 'innovation')}
              </Badge>
            </div>
          </Card>

          {/* Title & Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{innovation.title}</CardTitle>
              <p className="text-muted-foreground">{innovation.tagline}</p>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{innovation.description}</p>
            </CardContent>
          </Card>

          {/* Video Section */}
          {innovation.video_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Demo Video</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoThumbnailPlayer
                  videoUrl={innovation.video_url}
                  title={innovation.title}
                  onPlay={handleVideoPlay}
                />
              </CardContent>
            </Card>
          )}

          {/* WITH/WITHOUT Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg text-destructive break-words">
                  Without the Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm sm:text-base break-words overflow-hidden">{innovation.without_product}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg text-primary break-words">
                  With the Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm sm:text-base break-words overflow-hidden">{innovation.with_product}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Play className="h-4 w-4" />
                  Demo Plays
                </div>
                <span className="font-semibold">{viewCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  Hearts
                </div>
                <span className="font-semibold">{innovation.like_count || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Meta Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={innovation.status === 'published' ? 'status_open' : 'outline'}>
                  {innovation.status.charAt(0).toUpperCase() + innovation.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(innovation.created_at), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Updated</span>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(innovation.updated_at), 'MMM d, yyyy')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gallery */}
          {innovation.gallery_urls && innovation.gallery_urls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {innovation.gallery_urls.slice(0, 4).map((url, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InnovationViewPage;
