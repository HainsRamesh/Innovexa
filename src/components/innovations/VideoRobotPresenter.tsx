import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RobotPresenter3D } from './RobotPresenter3D';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROBOT_LANGUAGES, getFeatureScript } from '@/lib/robotLanguages';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Globe,
  Sparkles,
  Lightbulb,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoRobotPresenterProps {
  title?: string;
  tagline?: string;
  category?: string;
  description?: string;
  transcript?: string;
  videoUrl?: string;
}

type PlaybackState = 'idle' | 'ready' | 'playing' | 'paused';

const FEATURE_OPTIONS = [
  { id: 'zynovexa-overview', label: 'Zynovexa Overview', icon: Sparkles },
  { id: 'finops-automation', label: 'FinOps Automation', icon: Rocket },
  { id: 'innovation-matching', label: 'Innovation Matching', icon: Lightbulb },
];

export function VideoRobotPresenter({}: VideoRobotPresenterProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [volume, setVolumeState] = useState(0.8);
  
  // Multilingual feature state
  const [selectedLanguage, setSelectedLanguage] = useState(ROBOT_LANGUAGES[0]);
  const [selectedFeature, setSelectedFeature] = useState(FEATURE_OPTIONS[0].id);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
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

  // Find best voice for language
  const findVoiceForLanguage = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    if (!speechSupported) return null;
    
    const voices = window.speechSynthesis.getVoices();
    const exactMatch = voices.find(v => v.lang === langCode);
    if (exactMatch) return exactMatch;
    
    const langPrefix = langCode.split('-')[0];
    const partialMatch = voices.find(v => v.lang.startsWith(langPrefix));
    if (partialMatch) return partialMatch;
    
    return null;
  }, [speechSupported]);

  const speakText = useCallback((text: string, langCode?: string) => {
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

      if (langCode) {
        const voice = findVoiceForLanguage(langCode);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
          setFallbackMessage(null);
        } else {
          // Fallback to English
          const englishVoice = findVoiceForLanguage('en-US');
          if (englishVoice) {
            utterance.voice = englishVoice;
            utterance.lang = 'en-US';
          }
          if (langCode !== 'en-US') {
            setFallbackMessage(`${selectedLanguage.name} voice not available, using English`);
          }
        }
      } else {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))
        ) || voices.find((v) => v.lang.startsWith('en'));
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
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
  }, [volume, speechSupported, findVoiceForLanguage, selectedLanguage.name]);

  // Handle playing feature explanations
  const handlePlayFeature = useCallback(() => {
    if (playbackState === 'playing') {
      if (speechSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Silent
        }
      }
      setPlaybackState('idle');
      return;
    }

    const script = getFeatureScript(selectedFeature, selectedLanguage.code);
    speakText(script, selectedLanguage.code);
  }, [playbackState, speechSupported, selectedFeature, selectedLanguage.code, speakText]);

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

  return (
    <div className="rounded-lg border border-border bg-gradient-to-br from-muted/40 to-muted/20 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        Zynovexa Features
      </div>

      <div className="flex gap-4 items-start">
        {/* 3D Robot */}
        <div 
          className={cn(
            "flex-shrink-0 relative transition-all duration-300",
            isSpeaking && "animate-pulse"
          )}
        >
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

        {/* Feature Controls */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Language
            </label>
            <Select
              value={selectedLanguage.code}
              onValueChange={(code) => {
                const lang = ROBOT_LANGUAGES.find(l => l.code === code);
                if (lang) setSelectedLanguage(lang);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {ROBOT_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.nativeName}</span>
                      <span className="text-muted-foreground text-xs">({lang.name})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {fallbackMessage && (
              <p className="text-xs text-amber-500">{fallbackMessage}</p>
            )}
          </div>

          {/* Feature Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Explain Feature
            </label>
            <div className="grid grid-cols-1 gap-2">
              {FEATURE_OPTIONS.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFeature(option.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                      "border",
                      selectedFeature === option.id
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/30 border-transparent hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

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

          {/* Action Button */}
          <Button
            onClick={handlePlayFeature}
            variant={isSpeaking ? "destructive" : "default"}
            className="w-full gap-2"
          >
            {isSpeaking ? (
              <>
                <Pause className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Explain Feature
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Volume Controls */}
      {speechSupported && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
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
  );
}
