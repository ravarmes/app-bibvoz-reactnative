# Instruções para Publicação na Play Store

Este documento fornece um passo a passo detalhado para preparar e enviar o aplicativo Frase.me para a Google Play Store.

## 1. Preparação do Ambiente

Certifique-se de que seu ambiente de desenvolvimento esteja configurado corretamente:

```bash
# Instale todas as dependências
npm install

# Verifique se tudo está funcionando corretamente
npm run android
```

## 2. Gerar uma Chave de Assinatura

Para publicar na Play Store, você precisa de uma chave de assinatura:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore frase-me-key.keystore -alias frase-me-alias -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANTE**: Guarde a senha e a chave em um local seguro. Se você perder sua chave de assinatura, não poderá atualizar seu aplicativo na Play Store.

## 3. Configurar a Chave de Assinatura

Mova o arquivo `frase-me-key.keystore` para a pasta `android/app/`.

Edite o arquivo `android/gradle.properties` e adicione os valores reais (substitua os asteriscos):

```
MYAPP_UPLOAD_STORE_FILE=frase-me-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=frase-me-alias
MYAPP_UPLOAD_STORE_PASSWORD=sua-senha-aqui
MYAPP_UPLOAD_KEY_PASSWORD=sua-senha-aqui
```

## 4. Atualizar a Versão do Aplicativo

Antes de cada lançamento, atualize as versões nos seguintes arquivos:

1. Em `package.json`, atualize o campo `version`
2. Em `android/app/build.gradle`, atualize `versionCode` e `versionName`

**Nota**: `versionCode` deve ser incrementado em +1 a cada nova atualização enviada à Play Store.

## 5. Gerar o APK de Release

```bash
# Limpar build anteriores
cd android && ./gradlew clean

# Gerar o APK de release
./gradlew assembleRelease
```

O APK será gerado em: `android/app/build/outputs/apk/release/app-release.apk`

## 6. Gerar AAB (Android App Bundle) para a Play Store

A Google recomenda enviar um AAB em vez de um APK:

```bash
cd android && ./gradlew bundleRelease
```

O arquivo AAB será gerado em: `android/app/build/outputs/bundle/release/app-release.aab`

## 7. Testar o APK de Release

Antes de enviar, teste o APK de release em um dispositivo real:

```bash
# Instalação via ADB
adb install app/build/outputs/apk/release/app-release.apk
```

Verifique se:
- O aplicativo instala corretamente
- Todas as funcionalidades estão funcionando
- Os anúncios são exibidos corretamente
- O design está conforme esperado em diferentes tamanhos de tela

## 8. Preparar Metadados da Play Store

Prepare os seguintes metadados:

- **Título do aplicativo**: Frase.me
- **Descrição curta**: Seu acervo pessoal de frases motivacionais.
- **Descrição completa**: Um aplicativo para salvar, categorizar e avaliar suas frases inspiradoras favoritas. Crie seu acervo pessoal de motivação e inspire-se diariamente.
- **Ícone**: Use o ícone em `assets/icon.png` (512x512px)
- **Capturas de tela**: Use as imagens em `assets/Frase.me-Tela0*.png`
- **Vídeo promocional**: Use o vídeo em `assets/Frase.me-ReactNative.mp4`
- **Política de privacidade**: Use o documento `PRIVACY_POLICY.md`

## 9. Criar Conta de Desenvolvedor na Play Store

Se ainda não tiver, crie uma conta de desenvolvedor na Google Play Console:
- Acesse [play.google.com/console](https://play.google.com/console)
- Pague a taxa única de US$25

## 10. Enviar o Aplicativo

No Google Play Console:

1. Clique em "Criar aplicativo"
2. Selecione o idioma padrão (Português Brasil)
3. Digite o nome do aplicativo "Frase.me"
4. Selecione "Aplicativo" como tipo
5. Defina se é gratuito ou pago
6. Confirme a conformidade com as diretrizes da Play Store

## 11. Configurar a Ficha do Aplicativo

Preencha as seguintes seções no Play Console:

- **Fichas de loja**: Descrições, capturas de tela, ícones
- **Classificação de conteúdo**: Complete o questionário
- **Preço e distribuição**: Configure países e preço (se aplicável)
- **Configuração do aplicativo**: Forneça informações como email de contato
- **Política de privacidade**: Forneça o URL da sua política de privacidade

## 12. Enviar para Revisão

Após configurar tudo:

1. Faça upload do arquivo AAB em "Produção"
2. Preencha as notas de lançamento
3. Revise tudo
4. Clique em "Iniciar lançamento para produção"

## 13. Acompanhar o Status

A revisão do aplicativo geralmente leva de algumas horas a alguns dias. Você receberá um email quando o aplicativo for aprovado ou se houver problemas a resolver.

## 14. Atualizações Futuras

Para enviar atualizações:

1. Incremente `versionCode` e atualize `versionName` em `android/app/build.gradle`
2. Gere um novo AAB
3. Envie para a Play Store como uma nova versão 