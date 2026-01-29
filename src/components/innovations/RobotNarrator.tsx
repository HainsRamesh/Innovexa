import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RobotPresenter3D } from './RobotPresenter3D';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle2, SkipForward } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RobotNarratorProps {
  title: string;
  tagline: string;
  category: string;
  description: string;
  transcript?: string;
}

interface NarratorData {
  script: string;
  key_points: string[];
  emotion: 'confident' | 'friendly' | 'serious';
  gestures: Array<{ t: number; action: string }>;
  robot_theme: 'healthcare' | 'finance' | 'education' | 'climate' | 'ai' | 'security' | 'general';
}

/**
 * RobotNarrator - A fully custom robot presenter component.
 * 
 * This component is NOT connected to any Lovable AI Agent system.
 * It uses:
 * - Our custom edge function for script generation
 * - Web Speech API for text-to-speech
 * - React Three Fiber for 3D robot visualization
 * 
 * All state and rendering is fully controlled by this component.
 */
export function RobotNarrator({
  title,
  tagline,
  category,
  description,
  transcript,
}: RobotNarratorProps) {
  // State management - fully custom, no external agent
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'playing' | 'paused'>('idle');
  const [narratorData, setNarratorData] = useState<NarratorData | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cachedDataRef = useRef<NarratorData | null>(null);
  
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

  /**
   * Generate narrator script via our custom edge function.
   * No Lovable agent involved - direct API call.
   */
  const generateScript = useCallback(async (): Promise<NarratorData | null> => {
    if (cachedDataRef.current) {
      return cachedDataRef.current;
    }

    setStatus('generating');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-innovation-overview', {
        body: { title, tagline, category, description, transcript },
      });

      if (error) {
        console.warn('Script generation failed:', error.message);
        setStatus('idle');
        return null;
      }

      if (data?.script) {
        const result: NarratorData = {
          script: data.script,
          key_points: data.key_points || [],
          emotion: data.emotion || 'confident',
          gestures: data.gestures || [],
          robot_theme: data.robot_theme || 'general',
        };
        cachedDataRef.current = result;
        setNarratorData(result);
        setStatus('ready');
        return result;
      }

      setStatus('idle');
      return null;
    } catch (err) {
      console.warn('Script generation error:', err);
      setStatus('idle');
      return null;
    }
  }, [title, tagline, category, description, transcript]);

  /**
   * Speak text using native Web Speech API.
   * No external TTS service - browser built-in.
   */
  const speakText = useCallback((text: string) => {
    if (!speechSupported) return;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      utterance.rate = 0.95;
      utterance.pitch = 1;

      // Select a natural-sounding English voice
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
        setStatus('playing');
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setStatus('ready');
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        if (event.error !== 'canceled') {
          console.warn('Speech error:', event.error);
        }
        setStatus('ready');
        setIsSpeaking(false);
      };

      utterance.onpause = () => {
        setStatus('paused');
        setIsSpeaking(false);
      };
      
      utterance.onresume = () => {
        setStatus('playing');
        setIsSpeaking(true);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech failed:', err);
      setStatus('ready');
      setIsSpeaking(false);
    }
  }, [volume, speechSupported]);

  /**
   * Play Overview - main action button handler
   */
  const handlePlayOverview = useCallback(async () => {
    // Resume if paused
    if (status === 'paused' && speechSupported) {
      try {
        window.speechSynthesis.resume();
        setStatus('playing');
        setIsSpeaking(true);
        return;
      } catch {
        // Fall through to regenerate
      }
    }

    // Use cached data or generate new
    let data = cachedDataRef.current;
    if (!data) {
      data = await generateScript();
    }

    if (data?.script && speechSupported) {
      speakText(data.script);
    } else if (data?.script) {
      // TTS not supported - just show the text
      setStatus('ready');
    }
  }, [status, generateScript, speakText, speechSupported]);

  const handlePause = useCallback(() => {
    if (speechSupported) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // Silent
      }
      setStatus('paused');
      setIsSpeaking(false);
    }
  }, [speechSupported]);

  const handleReplay = useCallback(async () => {
    if (speechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Silent
      }
    }
    setIsSpeaking(false);

    const data = cachedDataRef.current;
    if (data?.script && speechSupported) {
      speakText(data.script);
    } else if (!data) {
      const newData = await generateScript();
      if (newData?.script && speechSupported) {
        speakText(newData.script);
      }
    }
  }, [generateScript, speakText, speechSupported]);

  const handleSkip = useCallback(() => {
    if (speechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Silent
      }
    }
    setStatus('ready');
    setIsSpeaking(false);
  }, [speechSupported]);

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 0.8);
  };

  // Determine if robot should be visible
  const showRobot = status !== 'idle';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Robot Narrator</h3>
      </div>
      
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        {/* Idle state - Show Play Overview button */}
        {status === 'idle' && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Get a 20-second executive briefing
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayOverview}
              className="gap-2 h-8"
            >
              <Play className="h-3.5 w-3.5" />
              Play Overview
            </Button>
          </div>
        )}

        {/* Generating state - Robot visible in idle animation */}
        {status === 'generating' && (
          <div className="flex items-center gap-4 py-2">
            <RobotPresenter3D isSpeaking={false} theme={narratorData?.robot_theme || 'general'} />
            <p className="text-sm text-muted-foreground animate-pulse">
              Generating overview...
            </p>
          </div>
        )}

        {/* Ready/Playing/Paused states - Full narrator UI */}
        {(status === 'ready' || status === 'playing' || status === 'paused') && (
          <div className="space-y-4">
            {/* Robot + Script content */}
            <div className="flex gap-4">
              {/* 3D Robot Presenter - always visible when active */}
              <div className="flex-shrink-0">
                <RobotPresenter3D 
                  isSpeaking={isSpeaking} 
                  theme={narratorData?.robot_theme || 'general'} 
                />
              </div>
              
              {/* Speaking indicator + Script */}
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
                {narratorData?.script && (
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {narratorData.script}
                  </p>
                )}
              </div>
            </div>

            {/* Key Points */}
            {narratorData?.key_points && narratorData.key_points.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Key Points
                </p>
                <ul className="space-y-1">
                  {narratorData.key_points.map((point, idx) => (
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
                      onClick={status === 'playing' ? handlePause : handlePlayOverview}
                      className="h-8 px-3 gap-1.5"
                    >
                      {status === 'playing' ? (
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
