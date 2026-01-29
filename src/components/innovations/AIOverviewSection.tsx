import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAIOverview } from '@/hooks/useAIOverview';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Overview</h3>
      </div>
      
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
        {/* Initial state - before generation */}
        {!hasGenerated && !isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                AI-generated summary available
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={handlePlayPause}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {speechSupported ? 'Play Overview' : 'Generate Overview'}
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Generating overview...
              </p>
            </div>
          </div>
        )}

        {/* Generated state - show controls and transcript */}
        {hasGenerated && !isLoading && (
          <>
            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {/* Play/Pause Button - only show if speech is supported */}
                {speechSupported && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handlePlayPause}
                    className="gap-2"
                  >
                    {isPlaying ? (
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
                )}
                
                {/* Replay Button - only show if speech is supported */}
                {speechSupported && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={replay}
                    title="Replay"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Volume Controls - only show if speech is supported */}
              {speechSupported && (
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
              )}
            </div>
            
            {/* Transcript */}
            {overviewText && (
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {overviewText}
                </p>
              </div>
            )}
            
            {/* Status indicator - only show when speaking */}
            {isSpeaking && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Speaking...</span>
              </div>
            )}
          </>
        )}

        {/* TODO: Future 3D Robot Integration
         * 
         * To add a realistic humanoid 3D robot with idle/talk animations:
         * 
         * 1. Import a GLB model with embedded animations named "Idle" and "Talk"
         * 2. Create a RobotScene component using React Three Fiber:
         *    - Use useGLTF to load the model
         *    - Use useAnimations to control animation states
         *    - Switch from "Idle" to "Talk" when isSpeaking is true
         * 3. Render the RobotScene component here when a model is available
         * 4. Example integration point:
         *    {hasRobotModel && <RobotScene isTalking={isSpeaking} />}
         * 
         * Required dependencies (already installed):
         * - @react-three/fiber
         * - @react-three/drei
         * - three
         */}
      </div>
    </div>
  );
}
