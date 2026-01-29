import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RobotPresenter3D } from './RobotPresenter3D';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, RotateCcw, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoRobotPresenterProps {
  title: string;
  tagline: string;
  category: string;
  description: string;
  transcript?: string;
  videoUrl?: string;
}

type PlaybackState = 'idle' | 'ready' | 'playing' | 'paused';

export function VideoRobotPresenter({
  title,
  tagline,
  category,
  description,
  transcript,
  videoUrl,
}: VideoRobotPresenterProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [volume, setVolumeState] = useState(0.8);
  const [scriptText, setScriptText] = useState<string | null>(null);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cachedScriptRef = useRef<string | null>(null);
  
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Silent cleanup
        }
      }
    };
  }, [speechSupported]);

  const speakText = useCallback((text: string) => {
    console.log('[VideoRobotPresenter] speakText called');
    
    if (!speechSupported) {
      console.log('[VideoRobotPresenter] TTS not supported');
      setPlaybackState('ready');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      utterance.rate = 0.95;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))
      ) || voices.find((v) => v.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        console.log('[VideoRobotPresenter] TTS started');
        setPlaybackState('playing');
      };
      utterance.onend = () => {
        console.log('[VideoRobotPresenter] TTS ended');
        setPlaybackState('ready');
      };
      utterance.onerror = (event) => {
        console.error('[VideoRobotPresenter] TTS error:', event.error);
        if (event.error !== 'canceled') {
          setError(`Audio playback failed`);
        }
        setPlaybackState('ready');
      };
      utterance.onpause = () => setPlaybackState('paused');
      utterance.onresume = () => setPlaybackState('playing');

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[VideoRobotPresenter] TTS failed:', err);
      setPlaybackState('ready');
    }
  }, [volume, speechSupported]);

  const handlePlay = useCallback(async () => {
    console.log('[VideoRobotPresenter] Play clicked');
    setError(null);
    
    // Resume if paused
    if (playbackState === 'paused' && speechSupported) {
      try {
        window.speechSynthesis.resume();
        setPlaybackState('playing');
        return;
      } catch (err) {
        console.error('[VideoRobotPresenter] Resume failed:', err);
      }
    }

    // If we have a cached script, just play it
    if (cachedScriptRef.current) {
      speakText(cachedScriptRef.current);
      return;
    }

    // Generate new script (silent loading - no UI indicator per requirements)
    setIsLoading(true);
    console.log('[VideoRobotPresenter] Generating script...');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-innovation-overview', {
        body: { title, tagline, category, description, transcript, videoUrl },
      });

      console.log('[VideoRobotPresenter] Response:', data);

      if (fnError) {
        console.error('[VideoRobotPresenter] Error:', fnError);
        setError(`Failed to generate overview`);
        setIsLoading(false);
        return;
      }

      if (data?.script) {
        cachedScriptRef.current = data.script;
        setScriptText(data.script);
        setKeyPoints(data.key_points || []);
        setPlaybackState('ready');
        setIsLoading(false);
        
        // Play audio
        if (speechSupported) {
          speakText(data.script);
        }
      } else {
        setError('No overview generated');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[VideoRobotPresenter] Error:', err);
      setError(`Generation failed`);
      setIsLoading(false);
    }
  }, [playbackState, speechSupported, speakText, title, tagline, category, description, transcript, videoUrl]);

  const handlePause = useCallback(() => {
    if (speechSupported) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // Silent
      }
      setPlaybackState('paused');
    }
  }, [speechSupported]);

  const handleReplay = useCallback(() => {
    if (speechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Silent
      }
    }
    
    if (cachedScriptRef.current && speechSupported) {
      speakText(cachedScriptRef.current);
    }
  }, [speechSupported, speakText]);

  const handleSkip = useCallback(() => {
    if (speechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Silent
      }
    }
    setPlaybackState('ready');
  }, [speechSupported]);

  const handleVolumeChange = (values: number[]) => {
    setVolumeState(values[0]);
    if (utteranceRef.current) {
      utteranceRef.current.volume = values[0];
    }
  };

  const toggleMute = () => {
    setVolumeState(volume > 0 ? 0 : 0.8);
  };

  const isSpeaking = playbackState === 'playing';
  const hasContent = scriptText !== null;

  return (
    <div className="rounded-lg border border-border bg-gradient-to-br from-muted/40 to-muted/20 p-4 space-y-4">
      {/* Robot presenter - always visible */}
      <div className="flex gap-4 items-start">
        {/* 3D Robot with speaking glow effect */}
        <div 
          className={cn(
            "flex-shrink-0 relative transition-all duration-300",
            isSpeaking && "animate-pulse"
          )}
        >
          {/* Speaking glow ring */}
          {isSpeaking && (
            <div className="absolute inset-0 -m-1 rounded-lg bg-primary/20 animate-ping" />
          )}
          <div className={cn(
            "relative rounded-lg overflow-hidden transition-shadow duration-300",
            isSpeaking && "ring-2 ring-primary/50 shadow-lg shadow-primary/20"
          )}>
            <RobotPresenter3D isSpeaking={isSpeaking} />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Speaking indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Robot is speaking...
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded p-2">
              {error}
            </div>
          )}

          {/* Idle state - play button */}
          {!hasContent && !isLoading && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Let the robot explain this innovation in 20-30 seconds
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={handlePlay}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Play Robot Overview
              </Button>
            </div>
          )}

          {/* Loading indicator - subtle, not a system loader */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>Robot is preparing...</span>
            </div>
          )}

          {/* Script text */}
          {hasContent && (
            <p className="text-sm text-foreground/90 leading-relaxed">
              {scriptText}
            </p>
          )}

          {/* Key points */}
          {keyPoints.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Key Points
              </p>
              <ul className="space-y-1">
                {keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      {hasContent && speechSupported && (
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={isSpeaking ? handlePause : handlePlay}
              className="h-8 px-3 gap-1.5"
            >
              {isSpeaking ? (
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
              onClick={handleReplay}
              className="h-8 w-8"
              title="Replay"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
              title="Skip"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {/* Volume Controls */}
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
        </div>
      )}
    </div>
  );
}
