import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExpressiveRobot3D, RobotEmotion } from './ExpressiveRobot3D';
import { supabase } from '@/integrations/supabase/client';
import { Play, Square, Volume2, VolumeX, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InnovationRobotPresenterProps {
  title: string;
  tagline: string;
  category: string;
  description: string;
  videoUrl?: string;
}

interface NarratorResponse {
  script: string;
  key_points: string[];
  emotion: 'confident' | 'friendly' | 'serious';
  robot_theme: string;
  transcript_used?: boolean;
}

export function InnovationRobotPresenter({
  title,
  tagline,
  category,
  description,
  videoUrl,
}: InnovationRobotPresenterProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [robotEmotion, setRobotEmotion] = useState<RobotEmotion>('idle');
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const emotionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechSupported) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
    };
  }, [speechSupported]);

  // Map API emotion to robot emotion
  const mapApiEmotionToRobot = (apiEmotion: string): RobotEmotion => {
    switch (apiEmotion) {
      case 'confident': return 'excited';
      case 'friendly': return 'happy';
      case 'serious': return 'thinking';
      default: return 'curious';
    }
  };

  // Cycle through emotions while speaking for expressiveness
  const startEmotionCycle = useCallback((baseEmotion: RobotEmotion) => {
    const emotions: RobotEmotion[] = ['speaking', baseEmotion, 'curious', 'happy', baseEmotion];
    let index = 0;
    
    setRobotEmotion('speaking');
    
    emotionIntervalRef.current = setInterval(() => {
      index = (index + 1) % emotions.length;
      setRobotEmotion(emotions[index]);
    }, 3000); // Change emotion every 3 seconds
  }, []);

  const stopEmotionCycle = useCallback(() => {
    if (emotionIntervalRef.current) {
      clearInterval(emotionIntervalRef.current);
      emotionIntervalRef.current = null;
    }
    setRobotEmotion('idle');
  }, []);

  const generateOverview = useCallback(async (): Promise<NarratorResponse | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-innovation-overview', {
        body: { title, tagline, category, description, videoUrl }
      });

      if (error) throw error;
      return data as NarratorResponse;
    } catch (err) {
      console.error('Failed to generate overview:', err);
      toast.error('Could not generate overview. Please try again.');
      return null;
    }
  }, [title, tagline, category, description, videoUrl]);

  const speakScript = useCallback((script: string, emotion: string) => {
    if (!speechSupported) {
      toast.error('Speech synthesis not supported in this browser');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.volume = isMuted ? 0 : 0.85;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium'))
    ) || voices.find(v => v.lang.startsWith('en-US'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    }

    const baseEmotion = mapApiEmotionToRobot(emotion);

    utterance.onstart = () => {
      setIsSpeaking(true);
      startEmotionCycle(baseEmotion);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      stopEmotionCycle();
      setRobotEmotion('happy'); // End on happy note
      setTimeout(() => setRobotEmotion('idle'), 2000);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      stopEmotionCycle();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [speechSupported, isMuted, startEmotionCycle, stopEmotionCycle]);

  const handlePlay = useCallback(async () => {
    // Stop if currently speaking
    if (isSpeaking) {
      if (speechSupported) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      setIsSpeaking(false);
      stopEmotionCycle();
      return;
    }

    // Use cached script if available
    if (generatedScript && hasGenerated) {
      speakScript(generatedScript, 'confident');
      return;
    }

    // Generate new script
    setIsLoading(true);
    setRobotEmotion('thinking');
    
    const response = await generateOverview();
    
    if (response?.script) {
      setGeneratedScript(response.script);
      setHasGenerated(true);
      speakScript(response.script, response.emotion);
    }
    
    setIsLoading(false);
  }, [isSpeaking, speechSupported, generatedScript, hasGenerated, generateOverview, speakScript, stopEmotionCycle]);

  const handleRegenerate = useCallback(async () => {
    if (isSpeaking) {
      if (speechSupported) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      setIsSpeaking(false);
      stopEmotionCycle();
    }

    setIsLoading(true);
    setRobotEmotion('thinking');
    setGeneratedScript(null);
    setHasGenerated(false);
    
    const response = await generateOverview();
    
    if (response?.script) {
      setGeneratedScript(response.script);
      setHasGenerated(true);
      speakScript(response.script, response.emotion);
    }
    
    setIsLoading(false);
  }, [isSpeaking, speechSupported, generateOverview, speakScript, stopEmotionCycle]);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 border border-border/50 backdrop-blur-sm">
      {/* Expressive Robot */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300",
        isSpeaking && "scale-105",
        isLoading && "animate-pulse"
      )}>
        <ExpressiveRobot3D emotion={robotEmotion} isSpeaking={isSpeaking} />
      </div>

      {/* Content and Controls */}
      <div className="flex-1 space-y-3">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">AI Innovation Guide</h4>
          <p className="text-xs text-muted-foreground">
            {isLoading 
              ? 'Analyzing innovation...' 
              : hasGenerated 
                ? 'Ready to explain this innovation'
                : 'Click play to hear about this innovation'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isSpeaking ? "destructive" : "default"}
            className="h-9 gap-2 min-w-[100px]"
            onClick={handlePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading
              </>
            ) : isSpeaking ? (
              <>
                <Square className="h-3.5 w-3.5" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                {hasGenerated ? 'Replay' : 'Explain'}
              </>
            )}
          </Button>

          {hasGenerated && !isLoading && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-2"
              onClick={handleRegenerate}
              title="Generate a new explanation"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${8 + Math.random() * 12}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.3 + Math.random() * 0.2}s`
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-primary font-medium">Speaking...</span>
          </div>
        )}
      </div>
    </div>
  );
}
