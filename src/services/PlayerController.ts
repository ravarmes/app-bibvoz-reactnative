import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioService, Lang } from './AudioService';
import { Verse } from './BibleService';

export type Phase = 'en' | 'pt' | 'idle';

export interface PlayerState {
  isPlaying: boolean;
  currentIndex: number;
  phase: Phase;
}

export interface PlayerController extends PlayerState {
  play: (startIndex?: number) => void;
  pause: () => void;
  jumpTo: (index: number) => void;
}

export function usePlayerController(verses: Verse[]): PlayerController {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');

  // Token incremental: qualquer chamada nova invalida loops anteriores em curso.
  const runTokenRef = useRef(0);

  useEffect(() => {
    AudioService.prepare();
    return () => {
      runTokenRef.current += 1;
      AudioService.stop();
    };
  }, []);

  const runFrom = useCallback(
    async (startIndex: number) => {
      const myToken = ++runTokenRef.current;
      setIsPlaying(true);

      let i = startIndex;
      while (i < verses.length && runTokenRef.current === myToken) {
        const verse = verses[i];
        setCurrentIndex(i);

        for (const step of [
          { lang: 'en-US' as Lang, text: verse.en, phase: 'en' as Phase },
          { lang: 'pt-BR' as Lang, text: verse.pt, phase: 'pt' as Phase },
        ]) {
          if (runTokenRef.current !== myToken) return;
          setPhase(step.phase);
          await AudioService.speak(step.text, step.lang);
        }

        i += 1;
      }

      if (runTokenRef.current === myToken) {
        setIsPlaying(false);
        setPhase('idle');
      }
    },
    [verses]
  );

  const play = useCallback(
    (startIndex?: number) => {
      const idx = typeof startIndex === 'number' ? startIndex : currentIndex;
      runFrom(idx);
    },
    [currentIndex, runFrom]
  );

  const pause = useCallback(() => {
    runTokenRef.current += 1;
    AudioService.stop();
    setIsPlaying(false);
    setPhase('idle');
  }, []);

  const jumpTo = useCallback(
    (index: number) => {
      const wasPlaying = isPlaying;
      runTokenRef.current += 1;
      AudioService.stop();
      setCurrentIndex(index);
      setPhase('idle');
      if (wasPlaying) {
        runFrom(index);
      } else {
        setIsPlaying(false);
      }
    },
    [isPlaying, runFrom]
  );

  return { isPlaying, currentIndex, phase, play, pause, jumpTo };
}
