---
name: BibVoz Project Overview
description: BibVoz React Native app - bilingual Bible TTS reader for English learning
type: project
---

BibVoz is a React Native 0.79.1 app for learning English through Bible passages using TTS.

**Architecture:**
- `src/services/AudioService.ts` - TTS singleton wrapper (react-native-tts), Lang type includes en-US, en-GB, pt-BR
- `src/services/BibleService.ts` - Bible data catalog (John 1-10, Psalms 1-2)
- `src/services/PlayerController.ts` - usePlayerController hook, exports EnVoice and PlaybackMode types
- `src/context/SettingsContext.tsx` - Persistent settings (AsyncStorage key: @bibvoz_settings_v1): enVoice, playbackMode, lastPosition, enSpeed, ptSpeed
- `src/context/IapContext.tsx` - Google Play Billing for "remove_ads" SKU
- `src/screens/BibleReaderScreen.tsx` - Single screen with header, verse list, controls panel, settings modal
- `App.tsx` - SettingsProvider > IapProvider > PaperProvider > BibleReaderScreen

**Key design decisions:**
- Default playback mode is PT→EN (Portuguese first, then English)
- Progress bar at top of controls panel shows chapter completion
- Mode badge (PT→EN, EN→PT, Só EN) always visible in controls
- British/American voice via en-GB vs en-US TTS language codes
- Last position persisted: restores book+chapter+verse on next app open
- PT speed control hidden when in en-only mode
- Header color: #5254CC with decorative circles for depth
- Background: #ECEEF8 (light indigo tint)

**Why:** Learning English via Bible passages - TTS plays each verse sequentially, user hears the language pair, no paid APIs needed.
