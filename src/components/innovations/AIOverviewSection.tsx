import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAIOverview } from '@/hooks/useAIOverview';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Loader2, Mic } from 'lucide-react';
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
    isSpeaking,
    volume,
    play,
    pause,
    replay,
    setVolume,
    overviewText,
    hasGenerated,
    speechSupported,
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
    <div className="space-y-3">
      {/* Header - minimal and professional */}
      <div className="flex items-center gap-2">
        <Mic className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">AI Briefing</h3>
      </div>
      
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        {/* Initial state - before generation */}
        {!hasGenerated && !isLoading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Get a 20-second executive summary
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              className="gap-2 h-8"
            >
              <Play className="h-3.5 w-3.5" />
              {speechSupported ? 'Play Briefing' : 'View Briefing'}
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center gap-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Preparing briefing...
            </p>
          </div>
        )}

        {/* Generated state - show transcript and controls */}
        {hasGenerated && !isLoading && (
          <div className="space-y-4">
            {/* Transcript with speaking indicator */}
            {overviewText && (
              <div className="space-y-2">
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-xs text-primary font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Speaking...
                  </div>
                )}
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {overviewText}
                </p>
              </div>
            )}
            
            {/* Controls - compact and clean */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                {speechSupported && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePlayPause}
                      className="h-8 px-3 gap-1.5"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          <span className="text-xs">Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span className="text-xs">Play</span>
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={replay}
                      className="h-8 w-8"
                      title="Replay"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
              
              {/* Volume Controls */}
              {speechSupported && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8"
                    title={volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {volume === 0 ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.1}
                    className="w-20"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TODO: Future 3D Humanoid Integration
       * 
       * To add a realistic humanoid presenter with idle/talk animations:
       * 
       * 1. Source a professional GLB model with "Idle" and "Talk" animation clips
       * 2. Create a PresenterScene component using React Three Fiber:
       *    - Use useGLTF to load the model
       *    - Use useAnimations to control animation states
       *    - Switch from "Idle" to "Talk" when isSpeaking is true
       * 3. Only render when a verified model URL is available
       * 4. Keep the text-based briefing as primary content
       * 
       * Required dependencies (already installed):
       * - @react-three/fiber
       * - @react-three/drei
       * - three
       */}
    </div>
  );
}
