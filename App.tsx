/**
 * App.tsx - BibVoz: Inglês pela Bíblia
 *
 * Mantém:
 *  - Banner AdMob fixo na parte inferior (oculto para usuários premium).
 *  - Fluxo de in-app purchase (Remover Anúncios) via IapProvider.
 *
 * Substitui o app de frases por um leitor bíblico bilíngue com TTS sequencial.
 */

import React, { useEffect } from 'react';
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
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => {
        console.log('AdMob SDK inicializado com sucesso');
      });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <SettingsProvider>
        <IapProvider>
          <PaperProvider>
            <BibleReaderScreen />
          </PaperProvider>
          <BottomBanner />
        </IapProvider>
      </SettingsProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    paddingVertical: 5,
  },
});

export default App;
