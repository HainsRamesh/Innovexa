import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Innovation } from '@/types';
import { InnovationGalleryCarousel } from './InnovationGalleryCarousel';
import { VideoThumbnailPlayer } from './VideoThumbnailPlayer';
import { useDemoPlayTracker } from '@/hooks/useDemoPlayTracker';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Download, 
  Bookmark, 
  MessageCircle, 
  Minus,
  Plus,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
interface InnovationDetailModalProps {
  innovation: Innovation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<string, string> = {
  ai: 'AI',
  healthtech: 'HealthTech',
  fintech: 'FinTech',
  climatetech: 'ClimateTech',
  edtech: 'EdTech',
  saas: 'SaaS',
  hardware: 'Hardware',
  web3: 'Web3',
  other: 'Other',
};

const categoryColors: Record<string, string> = {
  ai: 'bg-category-technology text-primary-foreground',
  healthtech: 'bg-category-healthcare text-primary-foreground',
  fintech: 'bg-category-finance text-primary-foreground',
  climatetech: 'bg-category-sustainability text-primary-foreground',
  edtech: 'bg-category-education text-primary-foreground',
  saas: 'bg-primary text-primary-foreground',
  hardware: 'bg-category-infrastructure text-primary-foreground',
  web3: 'bg-accent text-accent-foreground',
  other: 'bg-muted text-muted-foreground',
};


export const InnovationDetailModal = ({
  innovation,
  open,
  onOpenChange,
}: InnovationDetailModalProps) => {
  const { trackDemoPlay } = useDemoPlayTracker(innovation?.id || '');
  const { openChat } = useChat();
  const { user } = useAuth();
  
  if (!innovation) return null;

  const handleMessageInnovator = () => {
    // Get innovator name from innovation profiles if available
    const innovatorName = (innovation as any).profiles?.full_name || 'Innovator';
    
    // Create prefilled message
    const prefilledMessage = `Hi ${innovatorName}, I'm interested in your innovation "${innovation.title}". Can we discuss this further?`;
    
    openChat({
      userId: innovation.innovator_id,
      userName: innovatorName,
      userAvatar: (innovation as any).profiles?.avatar_url || null,
      prefilledMessage,
      innovationId: innovation.id,
      innovationTitle: innovation.title,
    });
  };

  const isOwnInnovation = user?.id === innovation.innovator_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6 space-y-6">
            {/* Header */}
            <DialogHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Badge className={cn('font-medium', categoryColors[innovation.category])}>
                    {categoryLabels[innovation.category]}
                  </Badge>
                  <DialogTitle className="text-2xl font-bold">
                    {innovation.title}
                  </DialogTitle>
                  <p className="text-muted-foreground">{innovation.tagline}</p>
                </div>
              </div>
            </DialogHeader>

            {/* Video Section */}
            {innovation.video_url && (
              <VideoThumbnailPlayer
                videoUrl={innovation.video_url}
                title={innovation.title}
                onPlay={trackDemoPlay}
              />
            )}

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">About this Innovation</h3>
              <div className="prose prose-sm prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {innovation.description}
                </p>
              </div>
            </div>

            {/* WITH vs WITHOUT Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">The Impact</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {/* WITHOUT */}
                <div className="relative rounded-lg border border-destructive/30 bg-destructive/5 p-5">
                  <div className="absolute -top-3 left-4 px-2 py-0.5 bg-destructive/20 rounded-full flex items-center gap-1.5">
                    <Minus className="h-3 w-3 text-destructive" />
                    <span className="text-xs font-medium text-destructive">Without the Product</span>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2 whitespace-pre-wrap">
                    {innovation.without_product}
                  </p>
                </div>

                {/* WITH */}
                <div className="relative rounded-lg border border-primary/30 bg-primary/5 p-5">
                  <div className="absolute -top-3 left-4 px-2 py-0.5 bg-primary/20 rounded-full flex items-center gap-1.5">
                    <Plus className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">With the Product</span>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2 whitespace-pre-wrap">
                    {innovation.with_product}
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Section */}
            {innovation.gallery_urls && innovation.gallery_urls.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gallery</h3>
                <InnovationGalleryCarousel
                  images={innovation.gallery_urls}
                  title={innovation.title}
                />
              </div>
            )}

            {/* PDFs Section */}
            {innovation.pdf_urls && innovation.pdf_urls.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Documents</h3>
                <div className="flex flex-wrap gap-3">
                  {innovation.pdf_urls.map((pdfUrl, index) => (
                    <a
                      key={index}
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm">Document {index + 1}</span>
                      <Download className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              {!isOwnInnovation && (
                <Button className="gap-2" onClick={handleMessageInnovator}>
                  <MessageCircle className="h-4 w-4" />
                  Message Innovator
                </Button>
              )}
              <Button variant="outline" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Save Innovation
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
