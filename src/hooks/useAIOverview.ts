import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAIOverviewProps {
  title: string;
  tagline: string;
  category: string;
  description: string;
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
  hasGenerated: boolean;
  speechSupported: boolean;
}

/**
 * Hook to manage AI overview generation and text-to-speech playback.
 * 
 * Key behaviors:
 * - Only generates content when play() is called (not on mount)
 * - Falls back to text-only if speech synthesis is unavailable
 * - Uses silent error handling to avoid user-facing errors
 * - Caches generated content to avoid regeneration
 */
export function useAIOverview({
  title,
  tagline,
  category,
  description,
}: UseAIOverviewProps): UseAIOverviewReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [overviewText, setOverviewText] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cachedOverviewRef = useRef<string | null>(null);
  
  // Check if speech synthesis is supported
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
   * Generate AI overview text from the edge function.
   * Uses defensive error handling - returns null on any failure.
   */
  const generateOverview = useCallback(async (): Promise<string | null> => {
    // Return cached overview if available
    if (cachedOverviewRef.current) {
      return cachedOverviewRef.current;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-innovation-overview', {
        body: { title, tagline, category, description },
      });

      if (error) {
        console.warn('AI overview generation failed silently:', error.message);
        return null;
      }

      if (data?.overview) {
        cachedOverviewRef.current = data.overview;
        setOverviewText(data.overview);
        setHasGenerated(true);
        return data.overview;
      }

      return null;
    } catch (err) {
      // Silent failure - log but don't show to user
      console.warn('AI overview generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [title, tagline, category, description]);

  /**
   * Speak the given text using Web Speech API.
   * Handles all errors silently - falls back to text-only display.
   */
  const speakText = useCallback((text: string) => {
    if (!speechSupported) {
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1;

      // Try to find a natural-sounding English voice
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
        // Silent handling - just reset state
        if (event.error !== 'canceled') {
          console.warn('Speech synthesis error:', event.error);
        }
        setIsPlaying(false);
        setIsSpeaking(false);
      };

      utterance.onpause = () => {
        setIsSpeaking(false);
      };

      utterance.onresume = () => {
        setIsSpeaking(true);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      // Silent failure
      console.warn('Speech synthesis failed:', err);
      setIsPlaying(false);
      setIsSpeaking(false);
    }
  }, [volume, speechSupported]);

  /**
   * Play the AI overview - generates if needed, then speaks.
   * If speech is not supported, just generates and displays text.
   */
  const play = useCallback(async () => {
    // If speech is paused, resume it
    if (speechSupported && window.speechSynthesis.paused) {
      try {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsSpeaking(true);
        return;
      } catch {
        // If resume fails, continue to regenerate/replay
      }
    }

    // Generate overview if not cached
    let text = cachedOverviewRef.current;
    if (!text) {
      text = await generateOverview();
    }

    // If we have text and speech is supported, speak it
    if (text && speechSupported) {
      speakText(text);
    } else if (text) {
      // Text-only fallback - just show the text
      setOverviewText(text);
      setHasGenerated(true);
    }
  }, [generateOverview, speakText, speechSupported]);

  /**
   * Pause speech playback.
   */
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

  /**
   * Replay the AI overview from the beginning.
   */
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

    const text = cachedOverviewRef.current;
    if (text && speechSupported) {
      speakText(text);
    } else if (!text) {
      // If no cached text, generate and play
      const newText = await generateOverview();
      if (newText && speechSupported) {
        speakText(newText);
      }
    }
  }, [generateOverview, speakText, speechSupported]);

  /**
   * Set the speech volume.
   */
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
    overviewText,
    hasGenerated,
    speechSupported,
  };
}
