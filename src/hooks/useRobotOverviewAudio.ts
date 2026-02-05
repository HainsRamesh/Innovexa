import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type RobotPlaybackState = "idle" | "loading" | "ready" | "playing" | "paused";

interface PlayOptions {
  getScript: () => Promise<string>;
}

interface RobotOverviewAudioApi {
  playbackState: RobotPlaybackState;
  isSpeaking: boolean;
  isSupported: boolean;
  volume: number;
  rate: number;
  pitch: number;
  setVolume: (v: number) => void;
  setRate: (v: number) => void;
  setPitch: (v: number) => void;
  play: (opts: PlayOptions) => Promise<void>;
  pause: () => void;
  skip: () => void;
  replay: () => void;
}

// Keys for persisted settings
const LS_KEY = "robot_overview_audio_settings";

const loadSettings = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { volume: number; rate: number; pitch: number };
  } catch {
    return null;
  }
};

const persistSettings = (settings: { volume: number; rate: number; pitch: number }) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

export function useRobotOverviewAudio(): RobotOverviewAudioApi {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const persisted = loadSettings();
  const [volume, setVolumeState] = useState(persisted?.volume ?? 0.8);
  const [rate, setRateState] = useState(persisted?.rate ?? 1);
  const [pitch, setPitchState] = useState(persisted?.pitch ?? 1);
  const [playbackState, setPlaybackState] = useState<RobotPlaybackState>("idle");

  const scriptRef = useRef<string | null>(null);
  const boundaryRef = useRef<number>(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkPrefixRef = useRef<number[]>([]); // cumulative char lengths
  const currentChunkIndexRef = useRef<number>(0);
  const continueQueueRef = useRef<boolean>(false);
  const volumeRef = useRef<number>(persisted?.volume ?? 0.8);
  const rafRef = useRef<number | null>(null);

  const saveSettings = useCallback(
    (next: { volume: number; rate: number; pitch: number }) => {
      persistSettings(next);
    },
    []
  );

  useEffect(() => {
    saveSettings({ volume, rate, pitch });
    volumeRef.current = volume;
  }, [volume, rate, pitch, saveSettings]);

  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!isSupported) return null;
    const voices = window.speechSynthesis.getVoices();
    // Prefer high-quality English-ish voices
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("premium"))
    );
    if (preferred) return preferred;
    return voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
  }, [isSupported]);

  const cleanupUtterance = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    utteranceRef.current = null;
    boundaryRef.current = 0;
    continueQueueRef.current = false;
  }, [isSupported]);

  const chunkScript = useCallback((text: string) => {
    // Split on sentence boundaries; keep fallback of whole text
    const parts = text
      .split(/(?<=[.!?])\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const baseChunks = parts.length === 0 ? [text] : parts;

    // Combine very short fragments with next to avoid choppy speech
    const combined: string[] = [];
    for (const part of baseChunks) {
      if (combined.length > 0 && part.length < 25) {
        combined[combined.length - 1] += " " + part;
      } else {
        combined.push(part);
      }
    }

    // Further split long chunks to improve mid-playback controls response (helps Windows)
    const MAX_CHARS = 120;
    const finalChunks: string[] = [];
    combined.forEach((chunk) => {
      if (chunk.length <= MAX_CHARS) {
        finalChunks.push(chunk);
        return;
      }
      // split by words keeping size <= MAX_CHARS
      const words = chunk.split(/\s+/);
      let current = "";
      words.forEach((w) => {
        if ((current + " " + w).trim().length > MAX_CHARS && current.length > 0) {
          finalChunks.push(current.trim());
          current = w;
        } else {
          current = (current + " " + w).trim();
        }
      });
      if (current.length > 0) finalChunks.push(current.trim());
    });

    return finalChunks;
  }, []);

  const buildPrefix = (chunks: string[]) => {
    const prefix: number[] = [];
    let total = 0;
    for (const c of chunks) {
      prefix.push(total);
      total += c.length + 1; // account for space between chunks
    }
    return prefix;
  };

  const findChunkAtOffset = (offset: number) => {
    const prefix = chunkPrefixRef.current;
    const chunks = chunksRef.current;
    for (let i = 0; i < prefix.length; i++) {
      const start = prefix[i];
      const end = start + chunks[i].length;
      if (offset >= start && offset <= end) {
        return { index: i, localOffset: offset - start };
      }
    }
    return { index: 0, localOffset: 0 };
  };

  const speakChunk = useCallback(
    (chunkIndex: number, localOffset: number, baseOffset: number) => {
      if (!isSupported || !scriptRef.current || !continueQueueRef.current) return;
      if (chunkIndex >= chunksRef.current.length) {
        setPlaybackState("ready");
        return;
      }

      const chunkText = chunksRef.current[chunkIndex].slice(localOffset);
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.volume = Math.max(0, Math.min(1, volumeRef.current));
      utterance.rate = Math.max(0.5, Math.min(2, rate));
      utterance.pitch = Math.max(0, Math.min(2, pitch));

      const voice = pickVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      const thisBase = baseOffset;

      utterance.onstart = () => {
        setPlaybackState("playing");
      };
      utterance.onend = () => {
        boundaryRef.current = thisBase + chunksRef.current[chunkIndex].length;
        if (!continueQueueRef.current) {
          setPlaybackState("ready");
          return;
        }
        currentChunkIndexRef.current = chunkIndex + 1;
        if (currentChunkIndexRef.current < chunksRef.current.length) {
          speakChunk(
            currentChunkIndexRef.current,
            0,
            chunkPrefixRef.current[currentChunkIndexRef.current]
          );
        } else {
          setPlaybackState("ready");
        }
      };
      utterance.onerror = (e) => {
        console.error("[robot-audio] speech error", e);
        setPlaybackState("ready");
      };
      utterance.onpause = () => setPlaybackState("paused");
      utterance.onresume = () => setPlaybackState("playing");
      utterance.onboundary = (event) => {
        if (typeof event.charIndex === "number") {
          boundaryRef.current = thisBase + event.charIndex + localOffset;
        }
      };

      utteranceRef.current = utterance;

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("[robot-audio] speak failed", err);
        setPlaybackState("ready");
      }
    },
    [isSupported, pickVoice, pitch, rate, volume]
  );

  const speakFrom = useCallback(
    (start: number) => {
      if (!isSupported || !scriptRef.current) return;

      cleanupUtterance();

      const { index, localOffset } = findChunkAtOffset(start);
      currentChunkIndexRef.current = index;
      continueQueueRef.current = true;
      speakChunk(index, localOffset, chunkPrefixRef.current[index] + localOffset);
    },
    [cleanupUtterance, findChunkAtOffset, isSupported, speakChunk]
  );

  const resumeIfPaused = useCallback(() => {
    if (!isSupported) return false;
    if (playbackState === "paused") {
      try {
        window.speechSynthesis.resume();
        setPlaybackState("playing");
        return true;
      } catch (err) {
        console.error("[robot-audio] resume failed", err);
      }
    }
    return false;
  }, [isSupported, playbackState]);

  const play = useCallback(
    async ({ getScript }: PlayOptions) => {
      if (!isSupported) return;

      // Resume instead of restarting if paused and we have content
      if (resumeIfPaused()) return;

      setPlaybackState("loading");
      try {
        const script = scriptRef.current ?? (await getScript());
        scriptRef.current = script;
        chunksRef.current = chunkScript(script);
        chunkPrefixRef.current = buildPrefix(chunksRef.current);
        boundaryRef.current = 0;
        setPlaybackState("ready");
        speakFrom(0);
      } catch (err) {
        console.error("[robot-audio] play failed", err);
        setPlaybackState("ready");
      }
    },
    [isSupported, resumeIfPaused, speakFrom, chunkScript]
  );

  const pause = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.pause();
      setPlaybackState("paused");
    } catch {
      /* ignore */
    }
  }, [isSupported]);

  const skip = useCallback(() => {
    if (!isSupported) return;
    cleanupUtterance();
    setPlaybackState("ready");
  }, [cleanupUtterance, isSupported]);

  const replay = useCallback(() => {
    if (!isSupported || !scriptRef.current) return;
    boundaryRef.current = 0;
    speakFrom(0);
  }, [isSupported, speakFrom]);

  const restartFromBoundary = useCallback(() => {
    if (!isSupported || playbackState !== "playing" || !scriptRef.current) return;
    const start = boundaryRef.current;
    speakFrom(start);
  }, [isSupported, playbackState, speakFrom]);

  const setVolume = useCallback(
    (v: number) => {
      const raw = Math.max(0, Math.min(1, v));
      const clamped = raw <= 0.001 ? 0 : raw; // snap-to-mute threshold
      volumeRef.current = clamped;
      setVolumeState(clamped);
      // Apply live to current utterance without restarting, batched to animation frame
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        if (utteranceRef.current) {
          utteranceRef.current.volume = clamped;
        }
        rafRef.current = null;
      });
    },
    []
  );

  const setRate = useCallback(
    (v: number) => {
      setRateState(v);
      if (playbackState === "playing") restartFromBoundary();
    },
    [playbackState, restartFromBoundary]
  );

  const setPitch = useCallback(
    (v: number) => {
      setPitchState(v);
      if (playbackState === "playing") restartFromBoundary();
    },
    [playbackState, restartFromBoundary]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      cleanupUtterance();
    };
  }, [cleanupUtterance]);

  const api: RobotOverviewAudioApi = useMemo(
    () => ({
      playbackState,
      isSpeaking: playbackState === "playing",
      isSupported,
      volume,
      rate,
      pitch,
      setVolume,
      setRate,
      setPitch,
      play,
      pause,
      skip,
      replay,
    }),
    [playbackState, isSupported, volume, rate, pitch, setVolume, setRate, setPitch, play, pause, skip, replay]
  );

  return api;
}
