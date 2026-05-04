Atue como um Engenheiro de Software Sênior especialista em React Native e Google Play Billing. Tenho um aplicativo React Native (já com anúncios rodando) e preciso que você implemente a funcionalidade de In-App Purchase (IAP) de pagamento único (non-consumable) para "Remoção de Anúncios".

Quero que a implementação siga estritamente os parâmetros abaixo que já validei em outro projeto de sucesso:

**1. Instalação e Configurações (Nativas Android):**
- Utilize a biblioteca `react-native-iap` (se possível fixando próximo a versão 12.16.4 para evitar conflitos recentes de C++ e Kotlin). Use também `@react-native-async-storage/async-storage` para persistência.
- Modifique ativamente o `android/app/build.gradle` e injete o bloco `missingDimensionStrategy 'store', 'play'` dentro do `defaultConfig`.
- No mesmo `build.gradle` (app), altere a `signingConfig` do bloco de `debug` para `signingConfigs.release`. Isso é crucial para que o faturamento funcione localmente no emulador!
- Certifique-se de que o `kotlinVersion` no root `build.gradle` será compatível (ex: 2.0.21, caso as versões mais novas quebrem o gradle build do IAP).

**2. O motor do Faturamento (Context API):**
Crie um arquivo chamado `IapContext.tsx`. Ele deve ser o coração de toda a regra de compras:
- Defina uma constante global para o SKU: `const REMOVE_ADS_SKU = 'ID_DO_PRODUTO_AQUI'`.
- O Provider deve exportar os seguintes estados: `isAdFree` (boolean), `isLoading` (boolean), e a função `purchaseRemoveAds()`.
- No `useEffect` principal, crie uma função assíncrona para iniciar:
  - Leia primeiro do `AsyncStorage` para inicialização imediata.
  - Faça `await initConnection()`.
  - É obrigatório chamar `await getProducts({ skus: [REMOVE_ADS_SKU] })` antes de qualquer outra coisa, caso contrário a requisição falhará com erro *PROMISE_BUY_ITEM*.
  - Chame `getAvailablePurchases()` para validar compras retroativas, atualizando `isAdFree = true` e o `AsyncStorage` se o produto for encontrado no inventário da carteira do usuário.
- Inicialize corretamente os dois listeners: `purchaseUpdatedListener` e `purchaseErrorListener`.
  - No sucesso do UpdateListener, não esqueça de chamar `await finishTransaction({ purchase, isConsumable: false })`. 
  - No erro, intercepte se o código for igual a `E_USER_CANCELLED` para apenas ignorar de forma silenciosa, e alerte outros erros.
  - Remova ambos os listeners no `return () => ... ` do `useEffect`.

**3. Intervenção na UI (Interface):**
- Onde os anúncios estão instanciados no app, envolva-os usando a variável de estado que expusemos (`if(isAdFree) return null`).
- Crie um botão atrativo ou um Card na Home chamado "Remover Anúncios" que chame o gatilho `purchaseRemoveAds()` (e seja ocultado quando `isAdFree` for true).
- Envolva o App.tsx (ou o router principal) dentro do `<IapProvider>`.

**Objetivo Imediato:**
Gere por favor (1) as instruções exatas de setup nativo para o build.gradle que devo injetar, (2) o código completo, robusto e tipado do arquivo `IapContext.tsx` e (3) exemplos de como envelopar meus anúncios (ex. BannerAd) e do Botão de gatilho para compra na minha Home. Aguardarei ansiosamente.
