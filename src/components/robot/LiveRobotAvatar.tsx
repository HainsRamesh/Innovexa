import { useState, useCallback } from 'react';
import { LiveRobot3D } from './LiveRobot3D';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { ROBOT_LANGUAGES, getFeatureScript } from '@/lib/robotLanguages';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Globe,
  Sparkles,
  Lightbulb,
  Rocket,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface LiveRobotAvatarProps {
  className?: string;
  compact?: boolean;
}

const FEATURE_OPTIONS = [
  { id: 'zynovexa-overview', label: 'ZyNoveXa Overview', icon: Sparkles },
  { id: 'finops-automation', label: 'FinOps Automation', icon: Rocket },
  { id: 'innovation-matching', label: 'Innovation Matching', icon: Lightbulb },
];

export function LiveRobotAvatar({ className, compact = false }: LiveRobotAvatarProps) {
  const [selectedFeature, setSelectedFeature] = useState(FEATURE_OPTIONS[0].id);
  const [mood, setMood] = useState<'idle' | 'happy' | 'thinking' | 'greeting'>('idle');
  
  const {
    speak,
    stop,
    isSpeaking,
    isSupported,
    selectedLanguage,
    setSelectedLanguage,
    fallbackMessage,
    speechProgress,
  } = useSpeechSynthesis();

  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      stop();
      setMood('idle');
      return;
    }

    const script = getFeatureScript(selectedFeature, selectedLanguage.code);
    setMood('happy');
    speak(script);
    
    // Reset mood after speech ends
    setTimeout(() => {
      if (!isSpeaking) setMood('idle');
    }, 1000);
  }, [isSpeaking, selectedFeature, selectedLanguage.code, speak, stop]);

  const handleGreet = useCallback(() => {
    setMood('greeting');
    const greetings: Record<string, string> = {
      'en-US': "Hello! I'm your ZyNoveXa assistant. How can I help you today?",
      'hi-IN': "नमस्ते! मैं आपका ZyNoveXa सहायक हूं। मैं आज आपकी कैसे मदद कर सकता हूं?",
      'ta-IN': "வணக்கம்! நான் உங்கள் ZyNoveXa உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
      'es-ES': "¡Hola! Soy tu asistente de ZyNoveXa. ¿Cómo puedo ayudarte hoy?",
    };
    const greeting = greetings[selectedLanguage.code] || greetings['en-US'];
    speak(greeting);
    setTimeout(() => setMood('idle'), 3000);
  }, [selectedLanguage.code, speak]);

  if (!isSupported) {
    return (
      <div className={cn("p-4 rounded-xl bg-muted/50 border border-border text-center", className)}>
        <VolumeX className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Speech synthesis is not supported in your browser.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="w-16 h-16 flex-shrink-0">
          <LiveRobot3D isSpeaking={isSpeaking} mood={mood} />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <Select
            value={selectedLanguage.code}
            onValueChange={(code) => {
              const lang = ROBOT_LANGUAGES.find(l => l.code === code);
              if (lang) setSelectedLanguage(lang);
            }}
          >
            <SelectTrigger className="w-24 h-8 text-xs">
              <Globe className="h-3 w-3 mr-1" />
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
          <Button
            size="sm"
            variant={isSpeaking ? "destructive" : "default"}
            onClick={handleSpeak}
            className="h-8"
          >
            {isSpeaking ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl bg-card border border-border overflow-hidden", className)}>
      {/* Robot Display */}
      <div className="aspect-square max-h-[280px] w-full relative">
        <LiveRobot3D isSpeaking={isSpeaking} mood={mood} />
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border">
              <Volume2 className="h-3.5 w-3.5 text-primary animate-pulse" />
              <Progress value={speechProgress * 100} className="h-1.5 flex-1" />
            </div>
          </div>
        )}
      </div>

      {/* Controls - ensure pointer events work */}
      <div className="p-4 space-y-4 bg-gradient-to-b from-transparent to-muted/30 relative z-10 pointer-events-auto">
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
            <SelectTrigger className="w-full pointer-events-auto relative z-10">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="z-[200]">
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
            <div className="flex items-center gap-1.5 text-xs text-amber-500">
              <AlertCircle className="h-3 w-3" />
              {fallbackMessage}
            </div>
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGreet}
            variant="outline"
            className="flex-1"
            disabled={isSpeaking}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Greet
          </Button>
          <Button
            onClick={handleSpeak}
            variant={isSpeaking ? "destructive" : "default"}
            className="flex-1"
          >
            {isSpeaking ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Explain
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
