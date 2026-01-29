import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RobotPresenter3D } from './RobotPresenter3D';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, RotateCcw, Volume2, VolumeX, SkipForward, Bot } from 'lucide-react';

interface VideoRobotPresenterProps {
  title: string;
  tagline: string;
  category: string;
  description: string;
  transcript?: string;
}

type PlaybackState = 'idle' | 'generating' | 'ready' | 'playing' | 'paused';

export function VideoRobotPresenter({
  title,
  tagline,
  category,
  description,
  transcript,
}: VideoRobotPresenterProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [volume, setVolumeState] = useState(0.8);
  const [scriptText, setScriptText] = useState<string | null>(null);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
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
    console.log('[VideoRobotPresenter] speakText called, speechSupported:', speechSupported);
    
    if (!speechSupported) {
      console.log('[VideoRobotPresenter] TTS not supported, skipping audio');
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
      console.log('[VideoRobotPresenter] Available voices:', voices.length);
      
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))
      ) || voices.find((v) => v.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('[VideoRobotPresenter] Using voice:', preferredVoice.name);
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
          setError(`TTS error: ${event.error}`);
        }
        setPlaybackState('ready');
      };
      utterance.onpause = () => setPlaybackState('paused');
      utterance.onresume = () => setPlaybackState('playing');

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[VideoRobotPresenter] TTS failed:', err);
      setError('TTS playback failed');
      setPlaybackState('ready');
    }
  }, [volume, speechSupported]);

  const handlePlay = useCallback(async () => {
    console.log('[VideoRobotPresenter] handlePlay clicked');
    setError(null);
    
    // Resume if paused
    if (playbackState === 'paused' && speechSupported) {
      console.log('[VideoRobotPresenter] Resuming paused speech');
      try {
        window.speechSynthesis.resume();
        setPlaybackState('playing');
        return;
      } catch (err) {
        console.error('[VideoRobotPresenter] Resume failed:', err);
      }
    }

    // If we already have a cached script, just play it
    if (cachedScriptRef.current) {
      console.log('[VideoRobotPresenter] Using cached script');
      speakText(cachedScriptRef.current);
      return;
    }

    // Generate new script
    console.log('[VideoRobotPresenter] Starting script generation...');
    setPlaybackState('generating');

    try {
      console.log('[VideoRobotPresenter] Calling edge function with:', { title, tagline, category });
      
      const { data, error: fnError } = await supabase.functions.invoke('generate-innovation-overview', {
        body: { title, tagline, category, description, transcript },
      });

      console.log('[VideoRobotPresenter] Edge function response:', { data, error: fnError });

      if (fnError) {
        console.error('[VideoRobotPresenter] Edge function error:', fnError);
        setError(`Generation failed: ${fnError.message}`);
        setPlaybackState('idle');
        return;
      }

      if (data?.script) {
        console.log('[VideoRobotPresenter] Script generated successfully, length:', data.script.length);
        cachedScriptRef.current = data.script;
        setScriptText(data.script);
        setKeyPoints(data.key_points || []);
        setPlaybackState('ready');
        
        // Attempt TTS playback
        if (speechSupported) {
          console.log('[VideoRobotPresenter] Starting TTS playback');
          speakText(data.script);
        } else {
          console.log('[VideoRobotPresenter] TTS not available, showing text only');
        }
      } else {
        console.error('[VideoRobotPresenter] No script in response:', data);
        setError('No script generated');
        setPlaybackState('idle');
      }
    } catch (err) {
      console.error('[VideoRobotPresenter] Script generation error:', err);
      setError(`Generation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPlaybackState('idle');
    }
  }, [playbackState, speechSupported, speakText, title, tagline, category, description, transcript]);

  const handlePause = useCallback(() => {
    console.log('[VideoRobotPresenter] handlePause');
    if (speechSupported) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // Silent failure
      }
      setPlaybackState('paused');
    }
  }, [speechSupported]);

  const handleReplay = useCallback(() => {
    console.log('[VideoRobotPresenter] handleReplay');
    if (speechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Silent failure
      }
    }
    
    if (cachedScriptRef.current && speechSupported) {
      speakText(cachedScriptRef.current);
    }
  }, [speechSupported, speakText]);

  const handleSkip = useCallback(() => {
    console.log('[VideoRobotPresenter] handleSkip');
    if (speechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Silent failure
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

  const isGenerating = playbackState === 'generating';
  const isSpeaking = playbackState === 'playing';
  const hasStarted = playbackState !== 'idle' && playbackState !== 'generating';

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Robot Overview</h3>
      </div>

      {/* Robot + Content */}
      <div className="flex gap-4">
        {/* 3D Robot - Always visible */}
        <div className="flex-shrink-0">
          <RobotPresenter3D isSpeaking={isSpeaking} />
        </div>

        {/* Content area */}
        <div className="flex-1 space-y-3">
          {/* Error display */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded p-2">
              {error}
            </div>
          )}

          {/* Idle state - show play button */}
          {playbackState === 'idle' && (
            <div className="flex flex-col justify-center h-full">
              <p className="text-sm text-muted-foreground mb-3">
                Get a quick AI-powered overview of this innovation
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlay}
                className="gap-2 w-fit"
              >
                <Play className="h-3.5 w-3.5" />
                {speechSupported ? 'Play Robot Overview' : 'View Overview'}
              </Button>
            </div>
          )}

          {/* Generating state */}
          {isGenerating && (
            <div className="flex flex-col justify-center h-full">
              <p className="text-sm text-muted-foreground animate-pulse">
                Generating overview...
              </p>
            </div>
          )}

          {/* Content display after generation */}
          {hasStarted && (
            <>
              {/* Speaking indicator */}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Speaking...
                </div>
              )}

              {/* Script text */}
              {scriptText && (
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
            </>
          )}
        </div>
      </div>

      {/* Playback Controls - Only show after content is ready */}
      {hasStarted && speechSupported && (
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
