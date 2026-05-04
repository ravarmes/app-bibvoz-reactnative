# 🚀 Configuração Inicial do Projeto

Este documento fornece instruções passo a passo para configurar o projeto **Frase.me** em sua máquina local.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (>= 18.0.0)
- **npm** ou **yarn**
- **React Native CLI**: `npm install -g @react-native-community/cli`
- **Android Studio** (para desenvolvimento Android)
- **Xcode** (para desenvolvimento iOS - apenas macOS)

## 🔧 Configuração Inicial

### 1. Clone e Instale Dependências

```bash
git clone [URL_DO_SEU_REPOSITORIO]
cd frase-me-admob
npm install
```

### 2. Configurar AdMob (OBRIGATÓRIO)

O projeto possui arquivos de exemplo que precisam ser configurados:

#### 2.1. Configurar adConfig.js
```bash
# Copie o arquivo de exemplo
cp src/utils/adConfig.example.js src/utils/adConfig.js
```

Edite `src/utils/adConfig.js` e substitua os IDs pelos seus IDs reais do AdMob:
- `androidAppId`: Seu App ID do Android
- `iosAppId`: Seu App ID do iOS  
- `bannerAdId`: Seu Banner Ad ID

#### 2.2. Atualizar outros arquivos com IDs do AdMob

Atualize também os seguintes arquivos com seus IDs reais:

**app.json**:
```json
{
  ...
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-SEU_ID_AQUI~XXXXXXXXXX",
    "ios_app_id": "ca-app-pub-SEU_ID_AQUI~XXXXXXXXXX"
  }
}
```

**android/app/src/main/AndroidManifest.**:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-SEU_ID_AQUI~XXXXXXXXXX"
    tools:replace="android:value"/>
```

### 3. Configurar Assinatura Android (Para Builds de Release)

#### 3.1. Gerar Chave de Assinatura
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore frase-me-key.keystore -alias frase-me-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### 3.2. Configurar gradle.properties
```bash
# Copie o arquivo template
cp android/gradle.properties.template android/gradle.properties
```

Edite `android/gradle.properties` e configure suas credenciais:
```properties
MYAPP_UPLOAD_STORE_FILE=frase-me-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=frase-me-alias
MYAPP_UPLOAD_STORE_PASSWORD=sua_senha_aqui
MYAPP_UPLOAD_KEY_PASSWORD=sua_senha_aqui
```

#### 3.3. Mover a Chave
```bash
# Mova a chave para a pasta correta
mv frase-me-key.keystore android/app/
```

## ▶️ Executar o Projeto

### Desenvolvimento Android
```bash
# Terminal 1 - Iniciar Metro
npm start

# Terminal 2 - Executar no Android
npm run android
```

### Desenvolvimento iOS (macOS apenas)
```bash
# Instalar dependências iOS
cd ios && pod install && cd ..

# Terminal 1 - Iniciar Metro
npm start

# Terminal 2 - Executar no iOS
npm run ios
```

## 🔒 Arquivos Sensíveis (NÃO committar)

Os seguintes arquivos contêm informações sensíveis e estão no .gitignore:

- `android/gradle.properties` - Credenciais de assinatura
- `src/utils/adConfig.js` - IDs reais do AdMob
- `*.keystore` - Chaves de assinatura
- Qualquer arquivo com senhas ou chaves

## 🏗️ Builds de Release

### APK de Release
```bash
cd android && ./gradlew assembleRelease
```

### AAB para Play Store
```bash
cd android && ./gradlew bundleRelease
```

## 🧪 Executar Testes

```bash
# Testes unitários
npm test

# Testes com cobertura
npm run test:coverage
```

## 🐛 Troubleshooting

### Problema: Metro não inicia
```bash
npx react-native-clean-project
npm install
```

### Problema: Build Android falha
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Problema: Erro de dependências iOS
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

## 📞 Suporte

Se encontrar problemas durante a configuração:

1. Verifique se todos os pré-requisitos estão instalados
2. Confirme se os IDs do AdMob estão corretos
3. Verifique se as chaves de assinatura estão no local correto
4. Consulte a documentação oficial do React Native

---

✅ **Configuração concluída!** Agora você pode começar a desenvolver no projeto Frase.me. 