// Web / unsupported platforms: ads are native-only, so everything is a no-op.
export async function initAds(): Promise<void> {}
export async function maybeShowInterstitial(): Promise<void> {}
export async function showRewardedAd(): Promise<boolean> {
  return false;
}
