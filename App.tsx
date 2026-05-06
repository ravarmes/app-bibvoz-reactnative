/**
 * App.tsx - BibVoz: Inglês pela Bíblia
 *
 * Mantém:
 *  - Banner AdMob fixo na parte inferior (oculto para usuários premium).
 *  - Fluxo de in-app purchase (Remover Anúncios) via IapProvider.
 *
 * Substitui o app de frases por um leitor bíblico bilíngue com TTS sequencial.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import mobileAds, {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';
import { Provider as PaperProvider } from 'react-native-paper';

import adConfig from './src/utils/adConfig';
import { IapProvider, useIap } from './src/context/IapContext';
import { SettingsProvider } from './src/context/SettingsContext';
import BibleReaderScreen from './src/screens/BibleReaderScreen';
import SplashScreen from './src/screens/SplashScreen';

const BottomBanner = () => {
  const { isAdFree } = useIap();
  const adUnitId = adConfig.getBannerAdId();

  if (isAdFree) return null;

  return (
    <View style={styles.adContainer}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
};

function App(): React.JSX.Element {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2D1B0E" />
      <SettingsProvider>
        <IapProvider>
          <PaperProvider>
            <BibleReaderScreen />
          </PaperProvider>
          <BottomBanner />
        </IapProvider>
      </SettingsProvider>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D1B0E',
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    paddingVertical: 5,
  },
});

export default App;
