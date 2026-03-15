import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getActiveSubscriptions,
  purchaseUpdatedListener,
  purchaseErrorListener,
  ErrorCode,
  type ProductSubscription,
  type PurchaseError,
  type Purchase,
} from 'react-native-iap';

const TIP_SUB_IDS = ['tip_small_yearly', 'tip_medium_yearly', 'tip_large_yearly'];

const TIP_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  tip_small_yearly: { name: 'cafe-outline', color: '#8B6914' },
  tip_medium_yearly: { name: 'heart-outline', color: '#C0392B' },
  tip_large_yearly: { name: 'star-outline', color: '#D4A017' },
};

const TIP_LABELS: Record<string, string> = {
  tip_small_yearly: 'Small Tip',
  tip_medium_yearly: 'Medium Tip',
  tip_large_yearly: 'Large Tip',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TipJarModal({ visible, onClose }: Props) {
  const [products, setProducts] = useState<ProductSubscription[]>([]);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [thankYou, setThankYou] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let purchaseUpdateSub: { remove: () => void } | null = null;
    let purchaseErrorSub: { remove: () => void } | null = null;
    let mounted = true;

    async function init() {
      try {
        await initConnection();

        // Check if user already has an active tip subscription
        const active = await getActiveSubscriptions(TIP_SUB_IDS);
        if (mounted && active && active.length > 0) {
          setActiveSub(active[0].productId);
        }

        const items = await fetchProducts({
          skus: TIP_SUB_IDS,
          type: 'subs',
        }) as ProductSubscription[] | null;
        if (mounted && items) {
          const sorted = [...items].sort(
            (a, b) => (a.price ?? 0) - (b.price ?? 0),
          );
          setProducts(sorted);
        }
      } catch {
        // Products unavailable — will show fallback UI
      } finally {
        if (mounted) setLoading(false);
      }

      purchaseUpdateSub = purchaseUpdatedListener(
        async (purchase: Purchase) => {
          try {
            await finishTransaction({ purchase });
          } catch {
            // finish failed — store will auto-retry
          }
          if (mounted) {
            setPurchasing(false);
            setThankYou(true);
          }
        },
      );

      purchaseErrorSub = purchaseErrorListener((error: PurchaseError) => {
        if (mounted) setPurchasing(false);
        if (error.code === ErrorCode.UserCancelled) return;
        Alert.alert('Purchase failed', error.message ?? 'Please try again.');
      });
    }

    init();

    return () => {
      mounted = false;
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
      endConnection();
    };
  }, [visible]);

  function handleClose() {
    setThankYou(false);
    setLoading(true);
    setProducts([]);
    setActiveSub(null);
    onClose();
  }

  async function handleSubscribe(productId: string) {
    setPurchasing(true);
    try {
      if (Platform.OS === 'ios') {
        await requestPurchase({
          type: 'subs',
          request: { apple: { sku: productId } },
        });
      } else {
        await requestPurchase({
          type: 'subs',
          request: { google: { skus: [productId] } },
        });
      }
    } catch {
      setPurchasing(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
      <View style={styles.sheet}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={22} color="#888" />
        </TouchableOpacity>

        {thankYou ? (
          <View style={styles.thankYou}>
            <Ionicons name="heart" size={48} color="#C0392B" />
            <Text style={styles.title}>Thank You!</Text>
            <Text style={styles.subtitle}>
              Your support means the world and helps keep Pie & Mash free for everyone.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Support the App</Text>
            <Text style={styles.subtitle}>
              Pie & Mash is free and always will be. If you'd like to help cover hosting
              costs, a yearly tip subscription is very much appreciated.
            </Text>

            {loading && <ActivityIndicator color="#2D5016" style={styles.loader} />}

            {!loading && products.length === 0 && (
              <View style={styles.unavailable}>
                <Ionicons name="storefront-outline" size={32} color="#ccc" />
                <Text style={styles.unavailableText}>Tip jar unavailable</Text>
                <Text style={styles.unavailableSubtext}>
                  In-app purchases aren't available on this device. Please try again later.
                </Text>
              </View>
            )}

            {!loading && products.length > 0 && (
              <View style={styles.tipButtons}>
                {products.map((product) => {
                  const icon = TIP_ICONS[product.id] ?? { name: 'gift-outline' as const, color: '#2D5016' };
                  const label = TIP_LABELS[product.id] ?? product.title;
                  const isActive = activeSub === product.id;
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.tipButton, isActive && styles.tipButtonActive]}
                      onPress={() => handleSubscribe(product.id)}
                      disabled={purchasing || isActive}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isActive ? 'checkmark-circle' : icon.name}
                        size={24}
                        color={isActive ? '#2D5016' : icon.color}
                      />
                      <View style={styles.tipInfo}>
                        <Text style={styles.tipLabel}>{label}</Text>
                        <Text style={styles.tipPeriod}>
                          {isActive ? 'Currently active' : 'per year'}
                        </Text>
                      </View>
                      <Text style={styles.tipPrice}>{product.displayPrice}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {purchasing && (
              <View style={styles.purchasingOverlay}>
                <ActivityIndicator color="#2D5016" size="large" />
                <Text style={styles.purchasingText}>Processing...</Text>
              </View>
            )}

            {!loading && products.length > 0 && (
              <Text style={styles.manageHint}>
                You can manage or cancel your subscription any time in your device's
                subscription settings.
              </Text>
            )}
          </>
        )}

        <Text style={styles.legal}>
          Subscriptions auto-renew yearly unless cancelled at least 24 hours before
          the end of the current period. Processed by Apple / Google.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  closeBtn: { alignSelf: 'flex-end', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 24 },
  loader: { marginVertical: 24 },

  unavailable: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  unavailableText: { fontSize: 16, fontWeight: '600', color: '#aaa', marginTop: 4 },
  unavailableSubtext: { fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 18 },

  tipButtons: { gap: 12, marginBottom: 8 },
  tipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f5f0',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  tipButtonActive: {
    backgroundColor: '#e8f0e0',
    borderWidth: 2,
    borderColor: '#2D5016',
  },
  tipInfo: { flex: 1 },
  tipLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  tipPeriod: { fontSize: 12, color: '#888', marginTop: 2 },
  tipPrice: { fontSize: 16, fontWeight: '800', color: '#2D5016' },

  purchasingOverlay: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  purchasingText: { fontSize: 14, color: '#888' },

  thankYou: { alignItems: 'center', paddingVertical: 24, gap: 10 },

  manageHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 12,
  },
  legal: { fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 16, marginTop: 16 },
});
