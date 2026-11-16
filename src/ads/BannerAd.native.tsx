import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adUnit, adsReady, initAds } from './ads.native';

export function AdBanner() {
  const [ready, setReady] = useState(adsReady());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void initAds().then(() => {
      if (alive) setReady(adsReady());
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!ready || failed) return null;
  return (
    <View style={{ alignItems: 'center', minHeight: 50 }} accessibilityLabel="Advertisement">
      <BannerAd
        unitId={adUnit('banner')}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
