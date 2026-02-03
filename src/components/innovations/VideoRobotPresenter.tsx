import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RobotPresenter3D } from './RobotPresenter3D';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROBOT_LANGUAGES, getFeatureScript } from '@/lib/robotLanguages';
import { Play, Square, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoRobotPresenterProps {
  title?: string;
  tagline?: string;
  category?: string;
  description?: string;
  transcript?: string;
  videoUrl?: string;
}

const FEATURE_OPTIONS = [
  { id: 'zynovexa-overview', label: 'Overview' },
  { id: 'finops-automation', label: 'FinOps' },
  { id: 'innovation-matching', label: 'Matching' },
];

export function VideoRobotPresenter({}: VideoRobotPresenterProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(ROBOT_LANGUAGES[0]);
  const [selectedFeature, setSelectedFeature] = useState(FEATURE_OPTIONS[0].id);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => {
      if (speechSupported) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    };
  }, [speechSupported]);

  const findVoice = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    if (!speechSupported) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.lang === langCode) || 
           voices.find(v => v.lang.startsWith(langCode.split('-')[0])) || null;
  }, [speechSupported]);

  const handlePlay = useCallback(() => {
    if (isSpeaking) {
      if (speechSupported) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      setIsSpeaking(false);
      return;
    }

    if (!speechSupported) return;

    const script = getFeatureScript(selectedFeature, selectedLanguage.code);
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.volume = isMuted ? 0 : 0.8;
    utterance.rate = 0.95;

    const voice = findVoice(selectedLanguage.code) || findVoice('en-US');
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, speechSupported, selectedFeature, selectedLanguage.code, isMuted, findVoice]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      {/* Robot with speaking animation */}
      <div className={cn(
        "flex-shrink-0 transition-transform duration-200",
        isSpeaking && "scale-105"
      )}>
        <RobotPresenter3D isSpeaking={isSpeaking} />
      </div>

      {/* Compact controls */}
      <div className="flex-1 flex flex-wrap items-center gap-2">
        {/* Language */}
        <Select
          value={selectedLanguage.code}
          onValueChange={(code) => {
            const lang = ROBOT_LANGUAGES.find(l => l.code === code);
            if (lang) setSelectedLanguage(lang);
          }}
        >
          <SelectTrigger className="h-8 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROBOT_LANGUAGES.map(lang => (
              <SelectItem key={lang.code} value={lang.code} className="text-xs">
                {lang.nativeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Feature pills */}
        <div className="flex gap-1">
          {FEATURE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelectedFeature(opt.id)}
              className={cn(
                "px-2 py-1 text-xs rounded-full transition-colors",
                selectedFeature === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Play/Stop & Mute */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            variant={isSpeaking ? "destructive" : "default"}
            className="h-8 gap-1.5"
            onClick={handlePlay}
          >
            {isSpeaking ? (
              <>
                <Square className="h-3 w-3" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Play
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
