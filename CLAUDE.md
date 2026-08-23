# BibVoz — CLAUDE.md

App Android de **inglês pela Bíblia**: mostra o versículo em duas traduções lado a lado e lê
em voz alta, para estudo de vocabulário.

Nasceu do **`app-template-reactnative`**. As regras gerais — acoplamento AdMob↔IAP, os 4
lugares do `applicationId`, `versionCode`, bug de build do Ninja/CMake no Windows, fluxo de
release — estão no [CLAUDE.md do template](../app-template-reactnative/CLAUDE.md) e em
`docs/RELEASE_INSTRUCTIONS.md`. Aqui fica só o que é diferente.

## Identidade

- **Pacote**: `br.com.vargascode.bibvoz` · **versão atual**: `versionCode 8` / `1.0.8`
- **IAP**: `remove_ads` em `src/context/IapContext.tsx`
- **AdMob**: `src/utils/adConfig.js` — gitignored, não commitar
- **NDK em uso**: `27.1.12297006` em `android/build.gradle` (o template ainda documenta 26.1)

## Específico deste app

- **TTS é o núcleo do produto**: `react-native-tts` faz a leitura dos versículos. Mudança em
  voz, velocidade ou idioma afeta a proposta do app — não ajustar "de passagem".
- **Conteúdo bíblico vem de fora**: `scripts/fetch-bible.js` baixa de `bible-api.com`
  (traduções `kjv` e `almeida`) para `src/data/`. Rodar o script é o jeito de atualizar o
  texto; não editar os JSON gerados à mão.
- **Não há `adConfig.example.js`** neste repo, ao contrário dos irmãos — se `adConfig.js`
  sumir, copiar de outro app derivado e trocar os IDs.

## Preferência de trabalho

Aplicar as alterações completas direto no código e, em seguida, gerar o build
(`.\deploy.ps1`) — em vez de entregar trechos para colar.

## Comandos

```bash
npm run android
npm run lint && npm test
.\deploy.ps1                              # build + versionamento
cd android && ./gradlew bundleRelease      # .aab assinado
```
