import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlaybackMode, EnVoice } from '../services/PlayerController';

export type { PlaybackMode, EnVoice };

export const REPEAT_OPTIONS = [1, 2, 3, 4] as const;
export type RepeatCount = (typeof REPEAT_OPTIONS)[number];

export interface LastPosition {
  bookId: string;
  chapter: number;
  verseIndex: number;
}

export interface Bookmark {
  bookId: string;
  chapter: number;
  verseNumber: number;
  addedAt: number;
}

interface SettingsState {
  enVoice: EnVoice;
  playbackMode: PlaybackMode;
  lastPosition: LastPosition | null;
  enSpeed: number;
  ptSpeed: number;
  enVoiceId: string | null;
  repeatCount: RepeatCount;
  bookmarks: Bookmark[];
}

interface SettingsContextValue extends SettingsState {
  setEnVoice: (v: EnVoice) => void;
  setPlaybackMode: (m: PlaybackMode) => void;
  saveLastPosition: (pos: LastPosition) => void;
  setEnSpeed: (r: number) => void;
  setPtSpeed: (r: number) => void;
  setEnVoiceId: (id: string | null) => void;
  setRepeatCount: (n: RepeatCount) => void;
  toggleBookmark: (bookId: string, chapter: number, verseNumber: number) => void;
  isBookmarked: (bookId: string, chapter: number, verseNumber: number) => boolean;
}

const STORAGE_KEY = '@bibvoz_settings_v1';

const DEFAULTS: SettingsState = {
  enVoice: 'en-US',
  playbackMode: 'pt-en',
  lastPosition: null,
  enSpeed: 0.50,
  ptSpeed: 0.75,
  enVoiceId: null,
  repeatCount: 1,
  bookmarks: [],
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const saved = JSON.parse(raw) as Partial<SettingsState>;
            setState(prev => ({ ...prev, ...saved }));
          } catch {}
        }
      })
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((patch: Partial<SettingsState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setEnVoice = useCallback((v: EnVoice) => persist({ enVoice: v }), [persist]);
  const setPlaybackMode = useCallback((m: PlaybackMode) => persist({ playbackMode: m }), [persist]);
  const saveLastPosition = useCallback((pos: LastPosition) => persist({ lastPosition: pos }), [persist]);
  const setEnSpeed = useCallback((r: number) => persist({ enSpeed: r }), [persist]);
  const setPtSpeed = useCallback((r: number) => persist({ ptSpeed: r }), [persist]);
  const setEnVoiceId = useCallback((id: string | null) => persist({ enVoiceId: id }), [persist]);
  const setRepeatCount = useCallback((n: RepeatCount) => persist({ repeatCount: n }), [persist]);

  const toggleBookmark = useCallback((bookId: string, chapter: number, verseNumber: number) => {
    setState(prev => {
      const exists = prev.bookmarks.some(b => b.bookId === bookId && b.chapter === chapter && b.verseNumber === verseNumber);
      const nextBookmarks = exists
        ? prev.bookmarks.filter(b => !(b.bookId === bookId && b.chapter === chapter && b.verseNumber === verseNumber))
        : [...prev.bookmarks, { bookId, chapter, verseNumber, addedAt: Date.now() }];
      const next = { ...prev, bookmarks: nextBookmarks };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (bookId: string, chapter: number, verseNumber: number) =>
      state.bookmarks.some(b => b.bookId === bookId && b.chapter === chapter && b.verseNumber === verseNumber),
    [state.bookmarks],
  );

  if (!ready) return null;

  return (
    <SettingsContext.Provider value={{ ...state, setEnVoice, setPlaybackMode, saveLastPosition, setEnSpeed, setPtSpeed, setEnVoiceId, setRepeatCount, toggleBookmark, isBookmarked }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
