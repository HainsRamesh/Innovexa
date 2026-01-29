import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAIOverviewProps {
  title: string;
  tagline: string;
  category: string;
  description: string;
}

interface UseAIOverviewReturn {
  isLoading: boolean;
  isPlaying: boolean;
  isTalking: boolean;
  volume: number;
  play: () => Promise<void>;
  pause: () => void;
  replay: () => Promise<void>;
  setVolume: (volume: number) => void;
  overviewText: string | null;
}

export function useAIOverview({
  title,
  tagline,
  category,
  description,
}: UseAIOverviewProps): UseAIOverviewReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [overviewText, setOverviewText] = useState<string | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cachedOverviewRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
        console.error('Error generating overview:', error);
        toast.error('Failed to generate AI overview');
        return null;
      }

      if (data?.overview) {
        cachedOverviewRef.current = data.overview;
        setOverviewText(data.overview);
        return data.overview;
      }

      toast.error('No overview generated');
      return null;
    } catch (err) {
      console.error('Error calling overview function:', err);
      toast.error('Failed to generate AI overview');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [title, tagline, category, description]);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      toast.error('Text-to-speech is not supported in your browser');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1;

    // Try to find a good voice
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
      setIsTalking(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsTalking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsTalking(false);
      if (event.error !== 'canceled') {
        toast.error('Speech synthesis failed');
      }
    };

    utterance.onpause = () => {
      setIsTalking(false);
    };

    utterance.onresume = () => {
      setIsTalking(true);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [volume]);

  const play = useCallback(async () => {
    // If already playing, just resume if paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsTalking(true);
      return;
    }

    // Generate overview if not cached
    let text = cachedOverviewRef.current;
    if (!text) {
      text = await generateOverview();
    }

    if (text) {
      speakText(text);
    }
  }, [generateOverview, speakText]);

  const pause = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsTalking(false);
    }
  }, []);

  const replay = useCallback(async () => {
    // Cancel current speech and start fresh
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsTalking(false);

    const text = cachedOverviewRef.current;
    if (text) {
      speakText(text);
    } else {
      const newText = await generateOverview();
      if (newText) {
        speakText(newText);
      }
    }
  }, [generateOverview, speakText]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  }, []);

  return {
    isLoading,
    isPlaying,
    isTalking,
    volume,
    play,
    pause,
    replay,
    setVolume,
    overviewText,
  };
}
