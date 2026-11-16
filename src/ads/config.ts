/** AdMob IDs for DailyMe (Android). Test IDs are used automatically in development builds. */
export const ADMOB_APP_ID = 'ca-app-pub-3753880887983252~5424402743';

export const PROD_AD_UNITS = {
  banner: 'ca-app-pub-3753880887983252/3546993107',
  interstitial: 'ca-app-pub-3753880887983252/2433221987',
  native: 'ca-app-pub-3753880887983252/3716890206',
  rewarded: 'ca-app-pub-3753880887983252/7763946420',
} as const;

/** Minimum gap between interstitials so ads never feel spammy. */
export const INTERSTITIAL_MIN_INTERVAL_MS = 3 * 60 * 1000;
