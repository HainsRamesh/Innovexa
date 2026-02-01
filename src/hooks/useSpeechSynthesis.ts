import { useState, useEffect, useCallback, useRef } from 'react';
import { RobotLanguage, DEFAULT_LANGUAGE, ROBOT_LANGUAGES } from '@/lib/robotLanguages';

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  selectedLanguage: RobotLanguage;
  setSelectedLanguage: (lang: RobotLanguage) => void;
  isLanguageSupported: boolean;
  fallbackMessage: string | null;
  speechProgress: number; // 0-1 progress through current speech
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<RobotLanguage>(DEFAULT_LANGUAGE);
  const [isLanguageSupported, setIsLanguageSupported] = useState(true);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [speechProgress, setSpeechProgress] = useState(0);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const estimatedDurationRef = useRef<number>(0);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  // Check if selected language is supported
  useEffect(() => {
    if (availableVoices.length === 0) return;

    const hasVoice = availableVoices.some(
      voice => voice.lang.startsWith(selectedLanguage.voicePattern)
    );

    setIsLanguageSupported(hasVoice);
    
    if (!hasVoice && selectedLanguage.code !== 'en-US') {
      setFallbackMessage(`${selectedLanguage.name} voice not available. Using English.`);
    } else {
      setFallbackMessage(null);
    }
  }, [selectedLanguage, availableVoices]);

  const findBestVoice = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    const lang = ROBOT_LANGUAGES.find(l => l.code === langCode);
    if (!lang) return null;

    // Try to find an exact match first
    let voice = availableVoices.find(v => v.lang === langCode);
    
    // Then try pattern match
    if (!voice) {
      voice = availableVoices.find(v => v.lang.startsWith(lang.voicePattern));
    }

    // Prefer female voices for friendlier tone
    const femaleVoice = availableVoices.find(
      v => v.lang.startsWith(lang.voicePattern) && 
           (v.name.toLowerCase().includes('female') || 
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('victoria') ||
            v.name.toLowerCase().includes('zira'))
    );

    return femaleVoice || voice || null;
  }, [availableVoices]);

  const speak = useCallback((text: string) => {
    if (!isSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Find voice for selected language or fallback to English
    let voice = findBestVoice(selectedLanguage.code);
    if (!voice && selectedLanguage.code !== 'en-US') {
      voice = findBestVoice('en-US');
    }

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    // Natural speech settings
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.05; // Slightly higher for friendly tone
    utterance.volume = 1;

    // Estimate duration (average 150 words per minute)
    const wordCount = text.split(/\s+/).length;
    estimatedDurationRef.current = (wordCount / 150) * 60 * 1000;
    startTimeRef.current = Date.now();

    // Track progress
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / estimatedDurationRef.current, 1);
      setSpeechProgress(progress);
    }, 100);

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setSpeechProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, selectedLanguage, findBestVoice]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setSpeechProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isPaused,
    isSupported,
    availableVoices,
    selectedLanguage,
    setSelectedLanguage,
    isLanguageSupported,
    fallbackMessage,
    speechProgress,
  };
}
