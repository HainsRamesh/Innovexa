import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAIOverview } from '@/hooks/useAIOverview';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Loader2, Sparkles, CheckCircle2, SkipForward } from 'lucide-react';

/**
 * TODO: 3D Robot Presenter Integration (CRITICAL REQUIREMENTS)
 * 
 * When implementing the robot narrator, follow these strict guidelines:
 * 
 * ROBOT REQUIREMENTS:
 * - Type: Professional humanoid AI presenter
 * - Style: Realistic or semi-realistic 3D (enterprise-grade)
 * - Appearance: Upper torso only (head + shoulders)
 * - Face: Minimal, neutral, calm (NO cartoon eyes, NO mascot face, NO emojis)
 * - Colors: Dark metallic / neutral tones (grey, black, subtle blue accents)
 * - Emotion: Calm, confident, neutral
 * - Animation: Subtle idle motion + light head movement while speaking
 * 
 * ABSOLUTELY DO NOT USE:
 * - Icons, mascots, emojis, flat illustrations
 * - Cartoon robots, default AI avatars
 * - Placeholder silhouettes or CSS-based fakes
 * 
 * IMPLEMENTATION STEPS:
 * 1. Acquire a proper GLB model matching the above specs
 * 2. Load GLB with useGLTF from @react-three/drei
 * 3. Use useAnimations to control Idle/Talk animation states
 * 4. Sync gesture timings from narratorData.gestures with animation triggers
 * 5. Map gestures: nod, open_palm_present, point, thumbs_up, wave
 * 6. Use narratorData.emotion to influence animations
 * 7. Apply narratorData.robotTheme for visual variations if supported
 * 
 * PLACEMENT:
 * - Robot appears ONLY when user clicks "Play Briefing" and narration is active
 * - Robot should be small (approx 80-100px) and not block video/content
 * - After narration ends, robot fades/minimizes
 */

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
    // TODO: Use these when GLB robot is integrated
    // robotTheme,
    // emotion,
    // gestures,
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
            {/* 
              TODO: When GLB robot is available, add a small idle preview here
              that activates on hover or stays minimal until Play is clicked.
              For now, no visual placeholder per the strict requirements.
            */}
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center gap-3 py-2">
            {/* 
              TODO: When GLB robot is available, show robot with loading animation here.
              Robot should have a subtle "thinking" or "preparing" pose.
            */}
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Preparing narrator script...
            </p>
          </div>
        )}

        {/* Generated state - narration ready or playing */}
        {hasGenerated && !isLoading && (
          <div className="space-y-4">
            {/* 
              TODO: GLB Robot Presenter Area
              
              When GLB is available, render here:
              - Canvas with <Suspense> wrapper
              - Robot model with isSpeaking controlling Talk vs Idle animation
              - Size: ~80-100px, positioned left of the script text
              - Fade out or minimize when narration ends (!isSpeaking && !isPlaying)
              
              Example structure:
              {isSpeaking && (
                <div className="w-20 h-20 flex-shrink-0">
                  <Canvas>
                    <Suspense fallback={null}>
                      <RobotPresenter 
                        isSpeaking={isSpeaking}
                        emotion={emotion}
                        gestures={gestures}
                        theme={robotTheme}
                      />
                    </Suspense>
                  </Canvas>
                </div>
              )}
            */}
            
            {/* Speaking indicator + Script */}
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
