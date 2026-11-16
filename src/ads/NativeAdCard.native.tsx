import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView } from 'react-native-google-mobile-ads';
import { useAppTheme } from '../theme';
import { adUnit, adsReady, initAds } from './ads.native';

export function NativeAdCard() {
  const theme = useAppTheme();
  const [ad, setAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    let alive = true;
    let loaded: NativeAd | null = null;
    void (async () => {
      try {
        await initAds();
        if (!adsReady() || !alive) return;
        loaded = await NativeAd.createForAdRequest(adUnit('native'));
        if (alive) setAd(loaded);
        else loaded.destroy();
      } catch {
        // No fill / offline: simply show nothing.
      }
    })();
    return () => {
      alive = false;
      loaded?.destroy();
    };
  }, []);

  if (!ad) return null;
  return (
    <NativeAdView
      nativeAd={ad}
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.line,
        backgroundColor: theme.surface,
        padding: 12,
        gap: 8,
      }}
    >
      <Text style={{ color: theme.muted, fontSize: 11, fontWeight: '700' }}>Sponsored</Text>
      <NativeMediaView style={{ width: '100%', height: 150, borderRadius: 12 }} />
      <NativeAsset assetType={NativeAssetType.HEADLINE}>
        <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 16 }}>{ad.headline}</Text>
      </NativeAsset>
      <NativeAsset assetType={NativeAssetType.BODY}>
        <Text style={{ color: theme.muted }}>{ad.body}</Text>
      </NativeAsset>
      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
        <View style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 10, alignItems: 'center' }}>
          <Text style={{ color: theme.onAccent, fontWeight: '700' }}>{ad.callToAction}</Text>
        </View>
      </NativeAsset>
    </NativeAdView>
  );
}
