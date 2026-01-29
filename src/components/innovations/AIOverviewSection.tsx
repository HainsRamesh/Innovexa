import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAIOverview } from '@/hooks/useAIOverview';
import { RobotPresenter3D } from './RobotPresenter3D';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle2, SkipForward } from 'lucide-react';

interface AIOverviewSectionProps {
  title: string;
  tagline: string;
  category: string;
  description: string;
  transcript?: string;
}

export function AIOverviewSection({
  title,
  tagline,
  category,
  description,
  transcript,
}: AIOverviewSectionProps) {
  const {
    isLoading,
    isPlaying,
    isSpeaking,
    volume,
    play,
    pause,
    replay,
    skip,
    setVolume,
    overviewText,
    keyPoints,
    robotTheme,
    hasGenerated,
    speechSupported,
  } = useAIOverview({ title, tagline, category, description, transcript });

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

  // Show robot when narration has been generated (visible during and after playback)
  const showRobot = hasGenerated || isLoading;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">AI Narrator</h3>
      </div>
      
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        {/* Initial state - before generation */}
        {!hasGenerated && !isLoading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Get a 20-second executive briefing
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

        {/* Loading state - Robot visible in idle mode, no loader UI */}
        {isLoading && (
          <div className="flex items-center gap-4 py-2">
            <RobotPresenter3D isSpeaking={false} theme={robotTheme} />
            <p className="text-sm text-muted-foreground">
              Generating briefing...
            </p>
          </div>
        )}

        {/* Generated state - narration ready or playing */}
        {hasGenerated && !isLoading && (
          <div className="space-y-4">
            {/* Robot + Script content */}
            <div className="flex gap-4">
              {/* 3D Robot Presenter */}
              <div className="flex-shrink-0">
                <RobotPresenter3D isSpeaking={isSpeaking} theme={robotTheme} />
              </div>
              
              {/* Speaking indicator + Script */}
              {overviewText && (
                <div className="flex-1 space-y-2">
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
            </div>

            {/* Key Points */}
            {keyPoints.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Key Points
                </p>
                <ul className="space-y-1">
                  {keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Playback Controls */}
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

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skip}
                      className="h-8 w-8"
                      title="Skip"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
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
    </div>
  );
}
