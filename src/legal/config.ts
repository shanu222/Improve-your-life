export const LEGAL = {
  appName: 'DailyMe',
  operator: 'DailyMe',
  packageName: 'app.daily.wellness',
  supportEmail: 'shahnawaz9974balouch@gmail.com',
  siteUrl: 'https://improve-your-life-ten.vercel.app',
  effectiveDate: '30 August 2026',
  minimumAge: 18,
} as const;

export const LEGAL_PATHS = {
  privacy: '/privacy-policy',
  terms: '/terms',
  support: '/support',
  deleteAccount: '/delete-account',
  dataControls: '/privacy',
} as const;

export function legalUrl(path: keyof typeof LEGAL_PATHS): string {
  return `${LEGAL.siteUrl}${LEGAL_PATHS[path]}`;
}
