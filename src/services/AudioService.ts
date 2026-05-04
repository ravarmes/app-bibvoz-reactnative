import Tts from 'react-native-tts';

export type Lang = 'en-US' | 'pt-BR';

type FinishHandler = () => void;

let initialized = false;
let initPromise: Promise<void> | null = null;

let activeFinishHandler: FinishHandler | null = null;
let activeUtteranceId: string | null = null;

let enRate = 0.50;
let ptRate = 0.75;

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
    if (lang === 'en-US') enRate = rate;
    else ptRate = rate;
  },

  getRate(lang: Lang): number {
    return lang === 'en-US' ? enRate : ptRate;
  },

  /**
   * Fala um texto no idioma indicado. Resolve a Promise apenas quando o áudio
   * termina ou é cancelado, viabilizando o encadeamento EN → PT → próximo versículo.
   */
  async speak(text: string, lang: Lang): Promise<void> {
    await ensureInit();

    await Tts.setDefaultLanguage(lang);
    await Tts.setDefaultRate(lang === 'en-US' ? enRate : ptRate, true);

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

  async stop(): Promise<void> {
    activeFinishHandler = null;
    activeUtteranceId = null;
    try {
      await Tts.stop();
    } catch {}
  },
};
