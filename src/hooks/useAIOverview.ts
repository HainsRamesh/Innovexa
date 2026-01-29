import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAIOverviewProps {
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

interface UseAIOverviewReturn {
  isLoading: boolean;
  isPlaying: boolean;
  isSpeaking: boolean;
  volume: number;
  play: () => Promise<void>;
  pause: () => void;
  replay: () => Promise<void>;
  setVolume: (volume: number) => void;
  overviewText: string | null;
  keyPoints: string[];
  emotion: string;
  gestures: Array<{ t: number; action: string }>;
  robotTheme: string;
  hasGenerated: boolean;
  speechSupported: boolean;
}

/**
 * Hook to manage AI overview generation and text-to-speech playback.
 * Returns structured narrator data including script, key points, emotion, and gestures.
 */
export function useAIOverview({
  title,
  tagline,
  category,
  description,
  transcript,
}: UseAIOverviewProps): UseAIOverviewReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [narratorData, setNarratorData] = useState<NarratorData | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cachedDataRef = useRef<NarratorData | null>(null);
  
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Cleanup speech synthesis on unmount
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
   * Generate AI narrator data from the edge function.
   */
  const generateOverview = useCallback(async (): Promise<NarratorData | null> => {
    if (cachedDataRef.current) {
      return cachedDataRef.current;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-innovation-overview', {
        body: { title, tagline, category, description, transcript },
      });

      if (error) {
        console.warn('AI overview generation failed silently:', error.message);
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
        setHasGenerated(true);
        return result;
      }

      return null;
    } catch (err) {
      console.warn('AI overview generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [title, tagline, category, description, transcript]);

  /**
   * Speak the given text using Web Speech API.
   */
  const speakText = useCallback((text: string) => {
    if (!speechSupported) return;

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
        setIsPlaying(true);
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        if (event.error !== 'canceled') {
          console.warn('Speech synthesis error:', event.error);
        }
        setIsPlaying(false);
        setIsSpeaking(false);
      };

      utterance.onpause = () => setIsSpeaking(false);
      utterance.onresume = () => setIsSpeaking(true);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
      setIsPlaying(false);
      setIsSpeaking(false);
    }
  }, [volume, speechSupported]);

  const play = useCallback(async () => {
    if (speechSupported && window.speechSynthesis.paused) {
      try {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsSpeaking(true);
        return;
      } catch {
        // Continue to regenerate/replay
      }
    }

    let data = cachedDataRef.current;
    if (!data) {
      data = await generateOverview();
    }

    if (data?.script && speechSupported) {
      speakText(data.script);
    } else if (data?.script) {
      setNarratorData(data);
      setHasGenerated(true);
    }
  }, [generateOverview, speakText, speechSupported]);

  const pause = useCallback(() => {
    if (speechSupported) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // Silent failure
      }
      setIsPlaying(false);
      setIsSpeaking(false);
    }
  }, [speechSupported]);

  const replay = useCallback(async () => {
    if (speechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Silent failure
      }
    }
    setIsPlaying(false);
    setIsSpeaking(false);

    const data = cachedDataRef.current;
    if (data?.script && speechSupported) {
      speakText(data.script);
    } else if (!data) {
      const newData = await generateOverview();
      if (newData?.script && speechSupported) {
        speakText(newData.script);
      }
    }
  }, [generateOverview, speakText, speechSupported]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  }, []);

  return {
    isLoading,
    isPlaying,
    isSpeaking,
    volume,
    play,
    pause,
    replay,
    setVolume,
    overviewText: narratorData?.script || null,
    keyPoints: narratorData?.key_points || [],
    emotion: narratorData?.emotion || 'confident',
    gestures: narratorData?.gestures || [],
    robotTheme: narratorData?.robot_theme || 'general',
    hasGenerated,
    speechSupported,
  };
}
