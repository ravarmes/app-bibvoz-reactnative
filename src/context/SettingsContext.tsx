import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlaybackMode, EnVoice } from '../services/PlayerController';

export type { PlaybackMode, EnVoice };

export interface LastPosition {
  bookId: string;
  chapter: number;
  verseIndex: number;
}

interface SettingsState {
  enVoice: EnVoice;
  playbackMode: PlaybackMode;
  lastPosition: LastPosition | null;
  enSpeed: number;
  ptSpeed: number;
}

interface SettingsContextValue extends SettingsState {
  setEnVoice: (v: EnVoice) => void;
  setPlaybackMode: (m: PlaybackMode) => void;
  saveLastPosition: (pos: LastPosition) => void;
  setEnSpeed: (r: number) => void;
  setPtSpeed: (r: number) => void;
}

const STORAGE_KEY = '@bibvoz_settings_v1';

const DEFAULTS: SettingsState = {
  enVoice: 'en-US',
  playbackMode: 'pt-en',
  lastPosition: null,
  enSpeed: 0.50,
  ptSpeed: 0.75,
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

  if (!ready) return null;

  return (
    <SettingsContext.Provider value={{ ...state, setEnVoice, setPlaybackMode, saveLastPosition, setEnSpeed, setPtSpeed }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
