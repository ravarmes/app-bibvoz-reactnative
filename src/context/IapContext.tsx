import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import {
  initConnection,
  endConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  flushFailedPurchasesCachedAsPendingAndroid,
  requestPurchase,
  getAvailablePurchases,
  getProducts,
  finishTransaction,
  ProductPurchase,
  PurchaseError,
} from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANTE: use o Product ID do item no Google Play Console.
// O Purchase Option ID pode ser diferente (ex.: remove-ads) e nao deve ser usado aqui.
const REMOVE_ADS_SKU = 'remove_ads';
const ASYNC_STORAGE_KEY = '@IAP_isAdFree';

interface IapContextData {
  isAdFree: boolean;
  purchaseRemoveAds: () => Promise<void>;
  isLoading: boolean;
}

const IapContext = createContext<IapContextData>({} as IapContextData);

export const IapProvider = ({ children }: { children: ReactNode }) => {
  const [isAdFree, setIsAdFree] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStoreConnected, setIsStoreConnected] = useState<boolean>(false);
  const [_isProductAvailable, setIsProductAvailable] = useState<boolean>(false);
  const [iapStatusMessage, setIapStatusMessage] = useState<string | null>(null);

  const syncRemoveAdsProduct = async () => {
    try {
      const products = await getProducts({ skus: [REMOVE_ADS_SKU] });
      const hasConfiguredProduct = products.some(
        product => product.productId === REMOVE_ADS_SKU
      );

      setIsProductAvailable(hasConfiguredProduct);

      if (!hasConfiguredProduct) {
        const message = `O Google Play nao retornou o produto ${REMOVE_ADS_SKU} para esta conta.`;
        setIapStatusMessage(message);
        console.warn(
          'IAP product unavailable',
          REMOVE_ADS_SKU,
          products.map(product => product.productId)
        );
      } else {
        setIapStatusMessage(null);
      }

      return hasConfiguredProduct;
    } catch (err) {
      console.warn('IAP getProducts error', err);
      setIsProductAvailable(false);
      const errorDetails =
        err instanceof Error ? err.message : 'Falha ao consultar o produto na Google Play.';
      setIapStatusMessage(errorDetails);
      return false;
    }
  };

  useEffect(() => {
    let purchaseUpdateSubscription: any = null;
    let purchaseErrorSubscription: any = null;

    const setupIap = async () => {
      try {
        // 1. Otimização: ler imediatamente se ele já tinha acesso no cache
        const localStatus = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
        const hasLocalAccess = localStatus === 'true';
        if (hasLocalAccess) {
          setIsAdFree(true);
        }

        // 2. Inicializa conexão com o serviço de faturamento
        const connected = await initConnection();
        setIsStoreConnected(Boolean(connected));
        setIapStatusMessage(
          connected
            ? null
            : 'Nao foi possivel conectar ao Google Play Billing neste dispositivo/conta.'
        );
        if (connected) {
          // Carrega o SKU na inicializacao e popula o cache nativo do Billing.
          await syncRemoveAdsProduct();

          // Utilizado no android para limpar compras pendentes de encerramento
          await flushFailedPurchasesCachedAsPendingAndroid();

          // 3. Checa o histórico de compras e produtos ativos do usuário via backend da loja
          const purchases = await getAvailablePurchases();
          const hasPurchased = purchases.some(p => p.productId === REMOVE_ADS_SKU);

          if (hasPurchased) {
            if (!hasLocalAccess) {
              setIsAdFree(true);
            }
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, 'true');
          } else if (hasLocalAccess) {
            // Evita esconder o botao para sempre por causa de um cache antigo.
            setIsAdFree(false);
            await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
          }
        }

        // 4. Criação dos listeners caso o usuário faça um request de compra ativamente
        purchaseUpdateSubscription = purchaseUpdatedListener(
          async (purchase: ProductPurchase) => {
            const receipt = purchase.transactionReceipt;
            if (receipt) {
              if (purchase.productId === REMOVE_ADS_SKU) {
                setIsAdFree(true);
                await AsyncStorage.setItem(ASYNC_STORAGE_KEY, 'true');
                Alert.alert('Eba!', 'Sua compra foi aprovada e os anúncios foram removidos com sucesso. Agradecemos muito o seu apoio.');
              }
              // Confirma a transação com a loja (acknowledgement)
              await finishTransaction({ purchase, isConsumable: false });
            }
          }
        );

        purchaseErrorSubscription = purchaseErrorListener(
          (error: PurchaseError) => {
            console.warn('Purchase error', error);
            if (error.code !== 'E_USER_CANCELLED') {
              const errorDetails = [error.code, error.message, error.debugMessage]
                .filter(Boolean)
                .join('\n');
              Alert.alert(
                'Aviso',
                errorDetails
                  ? `A compra nao foi concluida.\n\n${errorDetails}`
                  : 'A compra nao foi concluida.'
              );
            }
          }
        );

      } catch (err) {
        console.warn('IAP Initialization Error', err);
        setIsStoreConnected(false);
        setIsProductAvailable(false);
        const errorDetails =
          err instanceof Error ? err.message : 'Falha ao inicializar a cobranca in-app.';
        setIapStatusMessage(errorDetails);
      } finally {
        setIsLoading(false);
      }
    };

    setupIap();

    return () => {
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
      }
      endConnection();
    };
  }, []);

  const purchaseRemoveAds = async () => {
    try {
      if (isLoading) {
        Alert.alert(
          'Aviso',
          'A loja ainda esta sendo inicializada. Aguarde alguns segundos e tente novamente.'
        );
        return;
      }

      let connected = isStoreConnected;
      if (!connected) {
        connected = Boolean(await initConnection());
        setIsStoreConnected(connected);
        if (connected) {
          await flushFailedPurchasesCachedAsPendingAndroid();
        }
      }

      if (!connected) {
        Alert.alert(
          'Aviso',
          iapStatusMessage ||
            'Nao foi possivel conectar ao Google Play Billing. Confirme se este app foi instalado pela Google Play no teste interno, se a Play Store esta logada com a conta testadora correta e se os servicos do Google Play estao atualizados.'
        );
        return;
      }

      // Recarrega o SKU no momento do clique para evitar PROMISE_BUY_ITEM
      // quando o cache nativo nao foi populado corretamente na abertura do app.
      const hasConfiguredProduct = await syncRemoveAdsProduct();

      if (!hasConfiguredProduct) {
        Alert.alert(
          'Aviso',
          iapStatusMessage ||
            'A compra nao esta disponivel para esta conta no momento. Confirme se o produto remove_ads esta ativo, se a conta aceitou o convite do teste interno e se a instalacao veio da Google Play.'
        );
        return;
      }

      await requestPurchase({
        skus: [REMOVE_ADS_SKU],
      });
    } catch (err: any) {
      console.warn('requestPurchase error', err);
      const errorDetails = [err?.code, err?.message, err?.debugMessage]
        .filter(Boolean)
        .join('\n');
      Alert.alert(
        'Aviso',
        errorDetails
          ? `Nao foi possivel iniciar a compra neste momento.\n\n${errorDetails}`
          : 'Nao foi possivel iniciar a compra neste momento.'
      );
    }
  };

  return (
    <IapContext.Provider value={{ isAdFree, purchaseRemoveAds, isLoading }}>
      {children}
    </IapContext.Provider>
  );
};

export const useIap = () => useContext(IapContext);
