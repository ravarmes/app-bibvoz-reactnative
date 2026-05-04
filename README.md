# BibVoz – Inglês pela Bíblia

[![React Native](https://img.shields.io/badge/React%20Native-0.79.1-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Android](https://img.shields.io/badge/Platform-Android-3DDC84?style=flat-square&logo=android)](https://developer.android.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> Aprenda inglês ouvindo passagens bíblicas em sequência: **EN → PT → próximo versículo**, com avanço automático.

O MVP entrega o **Evangelho de João, Capítulo 1**, com áudio gerado pelo TTS nativo do dispositivo (sem APIs pagas, sem chamadas de rede).

## Como funciona

1. App toca o áudio do versículo em inglês (en-US).
2. Quando termina, toca o mesmo versículo em português (pt-BR).
3. Avança automaticamente para o próximo versículo e repete até o fim do capítulo.

A tela exibe o texto em inglês em destaque, com a tradução em português logo abaixo, e realça o versículo (e o idioma) que está sendo reproduzido no momento.

## Arquitetura

```
src/
├── data/bible/john_1.json     # Texto bilíngue (KJV + ARC, domínio público)
├── services/
│   ├── BibleService.ts        # Catálogo e leitura de capítulos
│   ├── AudioService.ts        # Wrapper sobre react-native-tts (singleton)
│   └── PlayerController.ts    # Hook que orquestra EN → PT → próximo
├── screens/
│   └── BibleReaderScreen.tsx  # Tela única do MVP
├── context/IapContext.tsx     # In-app purchase: Remover Anúncios (preservado)
└── utils/adConfig.js          # Configuração AdMob (preservado)
```

Princípios de design:
- **UI desconhece TTS** — só consome o hook `usePlayerController`.
- **AudioService é o único ponto** que toca em `react-native-tts`. Trocar para Expo Speech amanhã é uma edição local.
- **PlayerController** lida com cancelamento via *run token*: qualquer Play/Pause/JumpTo invalida loops anteriores em andamento, evitando o bug clássico de "duas vozes ao mesmo tempo".

## Monetização (preservada do app original)

- Banner AdMob fixo na parte inferior, oculto se o usuário comprou Remover Anúncios.
- Compra única `remove_ads` via Google Play Billing, com cache local em AsyncStorage.

A refatoração trocou as telas internas mas **não alterou** o `IapProvider` nem a montagem do `BannerAd` em `App.tsx`. O fluxo de compra continua exatamente como estava.

## Tecnologias

- **React Native** 0.79.1 / **React** 19.0.0 / **TypeScript**
- **react-native-tts** 4.1.1 — síntese de voz nativa (Android TextToSpeech / iOS AVSpeechSynthesizer)
- **react-native-paper** — componentes de UI Material
- **react-native-google-mobile-ads** — banner AdMob
- **react-native-iap** — Google Play Billing

## Como rodar

### Pré-requisitos
- Node.js ≥ 18
- JDK 17
- Android Studio (SDK + emulador) ou device Android
- Xcode (apenas para iOS, em macOS)

### Instalação
```bash
npm install

# Android
npm run android

# iOS (macOS)
cd ios && pod install && cd ..
npm run ios
```

> **iOS**: `react-native-tts` requer `pod install` após o primeiro `npm install`.
> **Engine TTS no Android**: alguns devices/emuladores vêm sem engine instalado. O `AudioService` chama `Tts.requestInstallEngine()` automaticamente quando detecta isso, e a Play Store abre para o usuário instalar o "Speech Services by Google".

### AdMob
Os IDs de teste do AdMob são usados automaticamente em `__DEV__`. Para produção, atualize:
- `app.json`
- `src/utils/adConfig.js`
- `android/app/src/main/AndroidManifest.xml`

## Deploy e build

Use o script `deploy.ps1` na raiz do projeto (requer PowerShell no Windows):

```powershell
# Instala no emulador aberto E gera o AAB (padrão)
.\deploy.ps1

# Somente instala no emulador aberto
.\deploy.ps1 emulator

# Somente gera o AAB para upload no Google Play
.\deploy.ps1 aab
```

O script detecta automaticamente incompatibilidade de assinatura e desinstala a versão anterior antes de reinstalar.

O AAB gerado fica em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Build manual (alternativa)

```powershell
# Instalar no emulador
cd android; .\gradlew.bat app:installDebug

# Gerar AAB de release
cd android; .\gradlew.bat bundleRelease
```

Configuração de assinatura via `android/gradle.properties` (keystore: `android/app/vargascode.keystore`).

## Roadmap (evolução pós-MVP)

- [x] Seletor de livro/capítulo — abas de livro e chips de capítulo no cabeçalho.
- [x] Controles de velocidade independentes para EN e PT (0,25× a 1,50×, passo 0,25).
- Seleção de voz (americana / britânica).
- Modo "só inglês" para alunos avançados, e modo "PT antes de EN" para iniciantes.
- Persistência do último versículo lido + retomada automática.
- Marcação de versículos favoritos e cartões de revisão (SRS).
- Download opcional de áudios pré-gravados de melhor qualidade.

## Licença

MIT — veja [LICENSE](LICENSE).

Textos bíblicos: KJV (King James Version) e ARC (Almeida Revista e Corrigida), ambos em domínio público.
