import Tts from 'react-native-tts';

export type Lang = 'en-US' | 'en-GB' | 'pt-BR';

export interface TtsVoice {
  id: string;
  name: string;
  language: string;
  quality: number;
  latency: number;
  networkConnectionRequired: boolean;
  notInstalled: boolean;
}

type FinishHandler = () => void;

let initialized = false;
let initPromise: Promise<void> | null = null;

let activeFinishHandler: FinishHandler | null = null;
let activeUtteranceId: string | null = null;

let enRate = 0.50;
let ptRate = 0.75;
let enVoiceId: string | null = null;
let ptVoiceId: string | null = null;

const ensureInit = async (): Promise<void> => {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await Tts.getInitStatus();
    } catch (err: any) {
      // No Android, "no_engine" indica que nenhum engine de TTS está instalado.
      if (err?.code === 'no_engine') {
        try {
          await Tts.requestInstallEngine();
        } catch {}
      }
    }

    Tts.addEventListener('tts-finish', () => {
      const handler = activeFinishHandler;
      activeFinishHandler = null;
      activeUtteranceId = null;
      if (handler) handler();
    });

    Tts.addEventListener('tts-cancel', () => {
      activeFinishHandler = null;
      activeUtteranceId = null;
    });

    initialized = true;
  })();

  return initPromise;
};

export const AudioService = {
  async prepare(): Promise<void> {
    await ensureInit();
  },

  setRate(lang: Lang, rate: number): void {
    if (lang !== 'pt-BR') enRate = rate;
    else ptRate = rate;
  },

  getRate(lang: Lang): number {
    return lang !== 'pt-BR' ? enRate : ptRate;
  },

  setVoice(voiceId: string | null): void {
    enVoiceId = voiceId;
    if (voiceId === null) {
      ptVoiceId = null;
    } else {
      // When male voice is selected, also pre-load the equivalent pt-BR voice (same index 7).
      ensureInit().then(() => Tts.voices()).then((all: any) => {
        const ptVoices = (all as TtsVoice[])
          .filter(v => !v.notInstalled && (v.language ?? '').toLowerCase().startsWith('pt'))
          .sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0));
        ptVoiceId = ptVoices[7]?.id ?? null;
      }).catch(() => { ptVoiceId = null; });
    }
  },

  getVoice(): string | null {
    return enVoiceId;
  },

  async getVoices(lang: Lang): Promise<TtsVoice[]> {
    await ensureInit();
    try {
      const all = await Tts.voices();
      const normalize = (l: string) => l.toLowerCase().replace('_', '-');
      const prefix = normalize(lang).substring(0, 5);
      return (all as TtsVoice[])
        .filter(v => !v.notInstalled && normalize(v.language ?? '').startsWith(prefix))
        .sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0));
    } catch {
      return [];
    }
  },

  /**
   * Fala um texto no idioma indicado. Resolve a Promise apenas quando o áudio
   * termina ou é cancelado, viabilizando o encadeamento EN → PT → próximo versículo.
   */
  async speak(text: string, lang: Lang): Promise<void> {
    await ensureInit();

    await Tts.setDefaultLanguage(lang);
    await Tts.setDefaultRate(lang !== 'pt-BR' ? enRate : ptRate, true);

    if (lang === 'pt-BR') {
      if (ptVoiceId) {
        try { await Tts.setDefaultVoice(ptVoiceId); } catch {}
      }
    } else if (enVoiceId) {
      try { await Tts.setDefaultVoice(enVoiceId); } catch {}
    }

    return new Promise<void>(resolve => {
      const utteranceId = `${Date.now()}-${Math.random()}`;
      activeUtteranceId = utteranceId;
      activeFinishHandler = () => resolve();

      Tts.stop().then(() => {
        // Após o stop, finish/cancel de execuções anteriores podem disparar tarde —
        // o utteranceId garante que só resolvamos para o pedido vigente.
        if (activeUtteranceId !== utteranceId) {
          resolve();
          return;
        }
        Tts.speak(text);
      });
    });
  },

  /** Reproduz uma frase de teste com a voz indicada, sem bloquear o fluxo de reprodução. */
  async previewVoice(voiceId: string | null, lang: Lang): Promise<void> {
    await ensureInit();
    activeFinishHandler = null;
    activeUtteranceId = null;
    try {
      await Tts.stop();
      await Tts.setDefaultLanguage(lang);
      await Tts.setDefaultRate(lang !== 'pt-BR' ? enRate : ptRate, true);
      if (voiceId) {
        try { await Tts.setDefaultVoice(voiceId); } catch {}
      }
      Tts.speak('Hello! This is a voice test.');
    } catch {}
  },

  async stop(): Promise<void> {
    activeFinishHandler = null;
    activeUtteranceId = null;
    try {
      await Tts.stop();
    } catch {}
  },
};
