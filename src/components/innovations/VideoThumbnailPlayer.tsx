import { useState, useCallback } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoThumbnailPlayerProps {
  videoUrl: string;
  title: string;
  onPlay?: () => void;
  className?: string;
}

const getVideoId = (url: string): { id: string; platform: 'youtube' | 'vimeo' | null } => {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return { id: youtubeMatch[1], platform: 'youtube' };
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { id: vimeoMatch[1], platform: 'vimeo' };
  }
  
  return { id: '', platform: null };
};

const getThumbnailUrl = (videoId: string, platform: 'youtube' | 'vimeo' | null): string => {
  if (platform === 'youtube') {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  // For Vimeo, we'd need to make an API call which we'll skip for now
  return '';
};

const getEmbedUrl = (videoId: string, platform: 'youtube' | 'vimeo' | null): string => {
  if (platform === 'youtube') {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
  }
  if (platform === 'vimeo') {
    return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  }
  return '';
};

export const VideoThumbnailPlayer = ({
  videoUrl,
  title,
  onPlay,
  className,
}: VideoThumbnailPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { id: videoId, platform } = getVideoId(videoUrl);
  
  const thumbnailUrl = getThumbnailUrl(videoId, platform);
  const embedUrl = getEmbedUrl(videoId, platform);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (onPlay) {
      onPlay();
      toast.success('Demo view tracked!', {
        duration: 2000,
      });
    }
  }, [onPlay]);

  if (!videoId || !platform) {
    return (
      <div className={cn("aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center", className)}>
        <p className="text-muted-foreground">Video unavailable</p>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className={cn("aspect-video rounded-lg overflow-hidden bg-muted", className)}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "aspect-video rounded-lg overflow-hidden bg-muted relative cursor-pointer group",
        className
      )}
      onClick={handlePlay}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to lower quality thumbnail
          const target = e.target as HTMLImageElement;
          if (target.src.includes('maxresdefault')) {
            target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
      
      {/* Custom Play Button */}
      <button
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-primary/90 hover:bg-primary hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-xl group-hover:shadow-2xl"
        onClick={handlePlay}
        aria-label={`Play ${title}`}
      >
        <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
      </button>
    </div>
  );
};
