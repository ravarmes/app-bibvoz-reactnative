import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioService, Lang } from './AudioService';
import { Verse } from './BibleService';

export type EnVoice = 'en-US' | 'en-GB';
export type PlaybackMode = 'pt-en' | 'en-pt' | 'en-only';
export type Phase = 'en' | 'pt' | 'idle';

const INTER_STEP_DELAY_MS = 180;
const INTER_VERSE_DELAY_MS = 360;

const sleepCancellable = (ms: number, isCancelled: () => boolean): Promise<void> =>
  new Promise(resolve => {
    const start = Date.now();
    const tick = () => {
      if (isCancelled()) return resolve();
      if (Date.now() - start >= ms) return resolve();
      setTimeout(tick, 40);
    };
    tick();
  });

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

interface PlayerOptions {
  playbackMode: PlaybackMode;
  enVoice: EnVoice;
  repeatCount?: number;
  initialIndex?: number;
  onVerseChange?: (index: number) => void;
}

export function usePlayerController(verses: Verse[], options: PlayerOptions): PlayerController {
  const { initialIndex = 0 } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [phase, setPhase] = useState<Phase>('idle');

  const runTokenRef = useRef(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    AudioService.prepare();
    return () => {
      runTokenRef.current += 1;
      AudioService.stop();
    };
  }, []);

  useEffect(() => {
    optionsRef.current.onVerseChange?.(currentIndex);
  }, [currentIndex]);

  const runFrom = useCallback(
    async (startIndex: number) => {
      const myToken = ++runTokenRef.current;
      setIsPlaying(true);

      let i = startIndex;
      while (i < verses.length && runTokenRef.current === myToken) {
        const verse = verses[i];
        setCurrentIndex(i);

        const { playbackMode, enVoice } = optionsRef.current;
        const enLang = enVoice as Lang;

        type Step = { lang: Lang; text: string; phase: Phase };
        let steps: Step[];
        switch (playbackMode) {
          case 'en-only':
            steps = [{ lang: enLang, text: verse.en, phase: 'en' }];
            break;
          case 'pt-en':
            steps = [
              { lang: 'pt-BR', text: verse.pt, phase: 'pt' },
              { lang: enLang, text: verse.en, phase: 'en' },
            ];
            break;
          default: // 'en-pt'
            steps = [
              { lang: enLang, text: verse.en, phase: 'en' },
              { lang: 'pt-BR', text: verse.pt, phase: 'pt' },
            ];
        }

        const repeat = optionsRef.current.repeatCount ?? 1;
        const isCancelled = () => runTokenRef.current !== myToken;
        for (let r = 0; r < repeat; r++) {
          for (let s = 0; s < steps.length; s++) {
            if (isCancelled()) return;
            setPhase(steps[s].phase);
            await AudioService.speak(steps[s].text, steps[s].lang);
            const isLastStepOfLastRepeat = s === steps.length - 1 && r === repeat - 1;
            if (!isLastStepOfLastRepeat) {
              await sleepCancellable(INTER_STEP_DELAY_MS, isCancelled);
            }
          }
        }

        i += 1;
        if (i < verses.length && !isCancelled()) {
          await sleepCancellable(INTER_VERSE_DELAY_MS, isCancelled);
        }
      }

      if (runTokenRef.current === myToken) {
        setIsPlaying(false);
        setPhase('idle');
      }
    },
    [verses],
  );

  const play = useCallback(
    (startIndex?: number) => {
      const idx = typeof startIndex === 'number' ? startIndex : currentIndex;
      runFrom(idx);
    },
    [currentIndex, runFrom],
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
    [isPlaying, runFrom],
  );

  return { isPlaying, currentIndex, phase, play, pause, jumpTo };
}
