import { logInternalError } from '../domain/errors';
import { INTERSTITIAL_MIN_INTERVAL_MS, PROD_AD_UNITS } from './config';

type AdsModule = typeof import('react-native-google-mobile-ads');

let mod: AdsModule | null = null;
let initPromise: Promise<void> | null = null;
let lastInterstitialAt = 0;

export function adUnit(kind: keyof typeof PROD_AD_UNITS): string {
  if (__DEV__ && mod) {
    const ids = mod.TestIds;
    return { banner: ids.BANNER, interstitial: ids.INTERSTITIAL, native: ids.NATIVE, rewarded: ids.REWARDED }[kind];
  }
  return PROD_AD_UNITS[kind];
}

/** Safe, idempotent init: gathers consent (UMP) then starts the SDK. Never throws. */
export function initAds(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const loaded = await import('react-native-google-mobile-ads');
      try {
        await loaded.AdsConsent.gatherConsent();
      } catch (error) {
        logInternalError('ads.consent', error);
      }
      await loaded.default().initialize();
      mod = loaded;
    } catch (error) {
      mod = null;
      logInternalError('ads.init', error);
    }
  })();
  return initPromise;
}

export function adsReady(): boolean {
  return mod !== null;
}

/** Shows an interstitial at a natural break, at most once per INTERSTITIAL_MIN_INTERVAL_MS. */
export async function maybeShowInterstitial(): Promise<void> {
  try {
    await initAds();
    if (!mod || Date.now() - lastInterstitialAt < INTERSTITIAL_MIN_INTERVAL_MS) return;
    const { InterstitialAd, AdEventType } = mod;
    const ad = InterstitialAd.createForAdRequest(adUnit('interstitial'));
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      const timer = setTimeout(done, 6000);
      ad.addAdEventListener(AdEventType.LOADED, () => {
        lastInterstitialAt = Date.now();
        clearTimeout(timer);
        void ad.show().catch(done);
      });
      ad.addAdEventListener(AdEventType.CLOSED, done);
      ad.addAdEventListener(AdEventType.ERROR, () => {
        clearTimeout(timer);
        done();
      });
      ad.load();
    });
  } catch (error) {
    logInternalError('ads.interstitial', error);
  }
}

/** Shows a rewarded ad; resolves true only if the user earned the reward. */
export async function showRewardedAd(): Promise<boolean> {
  try {
    await initAds();
    if (!mod) return false;
    const { RewardedAd, RewardedAdEventType, AdEventType } = mod;
    const ad = RewardedAd.createForAdRequest(adUnit('rewarded'));
    return await new Promise<boolean>((resolve) => {
      let earned = false;
      const timer = setTimeout(() => resolve(false), 8000);
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        clearTimeout(timer);
        void ad.show().catch(() => resolve(false));
      });
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      });
      ad.addAdEventListener(AdEventType.CLOSED, () => resolve(earned));
      ad.addAdEventListener(AdEventType.ERROR, () => {
        clearTimeout(timer);
        resolve(false);
      });
      ad.load();
    });
  } catch (error) {
    logInternalError('ads.rewarded', error);
    return false;
  }
}
