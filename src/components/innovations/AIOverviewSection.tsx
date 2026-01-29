import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AIRobotScene } from './AIRobotScene';
import { useAIOverview } from '@/hooks/useAIOverview';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Loader2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIOverviewSectionProps {
  title: string;
  tagline: string;
  category: string;
  description: string;
}

export function AIOverviewSection({
  title,
  tagline,
  category,
  description,
}: AIOverviewSectionProps) {
  const {
    isLoading,
    isPlaying,
    isTalking,
    volume,
    play,
    pause,
    replay,
    setVolume,
    overviewText,
  } = useAIOverview({ title, tagline, category, description });

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 0.8);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Overview</h3>
      </div>
      
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
        {/* 3D Robot Scene */}
        <AIRobotScene isTalking={isTalking} />
        
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            <Button
              variant="default"
              size="sm"
              onClick={handlePlayPause}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Play
                </>
              )}
            </Button>
            
            {/* Replay Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={replay}
              disabled={isLoading || !overviewText}
              title="Replay"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Volume Controls */}
          <div className="flex items-center gap-2 min-w-[140px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="shrink-0"
              title={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.1}
              className="flex-1"
            />
          </div>
        </div>
        
        {/* Transcript (shown after generation) */}
        {overviewText && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground italic">
              "{overviewText}"
            </p>
          </div>
        )}
        
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div 
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isTalking ? "bg-green-500 animate-pulse" : "bg-muted"
            )}
          />
          <span>
            {isLoading 
              ? "Generating overview..." 
              : isTalking 
                ? "Speaking..." 
                : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
