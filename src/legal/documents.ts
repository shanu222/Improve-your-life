import { HEALTH_DISCLAIMER } from '../domain/types';
import { LEGAL, legalUrl } from './config';

export type LegalSection = { heading: string; body: string[] };
export type LegalDocId = 'privacy' | 'terms' | 'support' | 'delete' | 'health';

export interface LegalDocument {
  id: LegalDocId;
  title: string;
  summary: string;
  sections: LegalSection[];
}

const contact = `Email ${LEGAL.supportEmail}. You can also use the support email on the DailyMe Google Play listing.`;

export const LEGAL_DOCS: Record<LegalDocId, LegalDocument> = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    summary: `${LEGAL.appName} is a personal wellness app. This policy explains what we collect, why we collect it, who processes it, and how you can export or delete it.`,
    sections: [
      {
        heading: 'Who we are',
        body: [
          `${LEGAL.appName} (${LEGAL.packageName}) is operated by the DailyMe developer. For privacy questions, contact ${LEGAL.supportEmail}.`,
          `This policy applies to the Android app and the DailyMe website at ${LEGAL.siteUrl}. Last updated ${LEGAL.effectiveDate}.`,
        ],
      },
      {
        heading: 'Who the app is for',
        body: [
          `DailyMe is for adults ${LEGAL.minimumAge} years and older. It is not directed at children, and we do not knowingly collect personal information from anyone under ${LEGAL.minimumAge}.`,
          'If you believe a child has created an account, email us and we will delete that account and its data.',
        ],
      },
      {
        heading: 'Information you provide',
        body: [
          'Account: email address, password (stored by Firebase Authentication, not in readable form), or Google account sign-in.',
          'Profile: optional name, age range, gender if you choose to enter it, height, weight, activity level, routines, and focus areas.',
          'Wellness logs you choose to save: meals, water, sleep, mood, exercise, habits, notes, caffeine, smoking if you log it, screen time, focus sessions, and similar entries.',
          'Support messages you send to our email.',
        ],
      },
      {
        heading: 'Health-related information',
        body: [
          'DailyMe stores wellness and lifestyle information that you enter. Nutrition values are estimates from your description or a temporary photo analysis. This is not medical data from a hospital or clinician, and DailyMe is not a medical device.',
          HEALTH_DISCLAIMER,
        ],
      },
      {
        heading: 'Advertising (Google AdMob)',
        body: [
          'DailyMe shows ads served by Google AdMob. AdMob may use your device advertising ID and similar device and usage data to show and measure ads. Where required, we ask for your consent before personalised ads are shown.',
          'Your wellness logs, notes, meals and health entries are never shared with advertisers. You can reset or opt out of your advertising ID in your Android settings (Settings > Google > Ads).',
        ],
      },
      {
        heading: 'Photos and camera',
        body: [
          'If you take or choose a meal photo, it is sent only to generate a nutrition estimate and is then discarded. DailyMe does not permanently store food photographs on your device cloud backup for DailyMe, in Firebase Storage, or on our servers.',
          'Only the estimate and any text you typed are saved. You can always log a meal by typing instead of using a photo.',
          'Camera and photo-library access are optional and requested only when you use those buttons. If you deny permission, you can still type the meal.',
        ],
      },
      {
        heading: 'Location',
        body: [
          'Location is optional and used only if you ask DailyMe to fill local weather. You can type temperature and conditions instead. We do not use location for advertising or tracking.',
        ],
      },
      {
        heading: 'Notifications and device tokens',
        body: [
          'If you enable reminders, DailyMe stores your reminder preferences and a device push token so it can send notifications you asked for. You can turn reminders off at any time in the app or in Android settings.',
        ],
      },
      {
        heading: 'Information created by the app',
        body: [
          'App activity needed to run your account: a user ID, sign-in timestamps, sync status, and scores or insights generated from your logs.',
          'We do not run third-party advertising SDKs and we do not sell personal information.',
        ],
      },
      {
        heading: 'How we use information',
        body: [
          'To create and secure your account, sync your data, show your day and week, send the reminders you enabled, and estimate meals or write insights when you ask.',
          'To keep the service reliable, prevent abuse, and respond to your support requests.',
          'We do not use your wellness logs for advertising.',
        ],
      },
      {
        heading: 'Processors who help us run DailyMe',
        body: [
          'Google Firebase: Authentication, Cloud Firestore, and Firebase Cloud Messaging. Your account and synced logs live in the Firebase project used by DailyMe.',
          'Google Sign-In: only if you choose Continue with Google.',
          'Vercel: hosts DailyMe API routes such as meal estimates, insights, email verification codes, and account deletion.',
          'AI model providers used only when you request a photo estimate or an insight. Photo bytes are processed for that request and are not kept as a photo library.',
          'These providers process data on our instructions to operate DailyMe. They are not given your data to sell.',
        ],
      },
      {
        heading: 'Sharing',
        body: [
          'We do not sell personal data. We do not share wellness logs with other users. There is no public profile.',
          'We may disclose information if required by law, to protect someone from serious harm, or to defend legal rights.',
        ],
      },
      {
        heading: 'Storage, security, and retention',
        body: [
          'Data in transit uses HTTPS. Account passwords are handled by Firebase Authentication. Logs are stored in your account until you delete them or delete the account.',
          'Local data on your phone is used so DailyMe works when the network is unavailable. Signing out does not always wipe the phone copy; account deletion does remove cloud account data.',
          'We keep data only as long as needed to provide DailyMe or as required by law. After you delete your account, we remove personal data from our systems except limited records we must keep for security or legal reasons.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'You can view and edit profile details in the app, export a copy of your data, and delete your account.',
          `In-app: Profile → Privacy & data, or ${legalUrl('dataControls')}. Account deletion: ${legalUrl('deleteAccount')}.`,
          'Depending on where you live, you may have rights to access, correct, delete, or restrict processing, and to complain to a data protection authority. Email us to use those rights.',
        ],
      },
      {
        heading: 'International processing',
        body: [
          'Firebase, Google, Vercel, and AI providers may process data in the United States or other countries. If you use DailyMe, you understand your information may be processed outside your country with the safeguards those providers offer.',
        ],
      },
      {
        heading: 'Changes',
        body: [
          'If this policy changes in a material way, we will update the date at the top and post the new policy at this URL. Continued use after an update means you accept the revised policy where the law allows.',
        ],
      },
    ],
  },
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    summary: `These terms govern your use of ${LEGAL.appName}. By creating an account or using the app, you agree to them.`,
    sections: [
      {
        heading: 'Agreement',
        body: [
          `These Terms of Service (“Terms”) are an agreement between you and the operator of ${LEGAL.appName}. They apply to the Android app and the website at ${LEGAL.siteUrl}. Last updated ${LEGAL.effectiveDate}.`,
          `By creating an account, tapping accept, or using DailyMe, you agree to these Terms and to the Privacy Policy at ${legalUrl('privacy')}. If you do not agree, do not use the app.`,
        ],
      },
      {
        heading: 'Eligibility',
        body: [
          `You must be at least ${LEGAL.minimumAge} years old. DailyMe is not for children.`,
          'You must provide accurate account information and keep your password or Google account secure. You are responsible for activity on your account.',
        ],
      },
      {
        heading: 'The service',
        body: [
          'DailyMe helps you log daily wellness habits, estimate meals, see summaries, and receive optional reminders.',
          HEALTH_DISCLAIMER,
          'Features that use a network connection may be unavailable if our providers or your connection fail. We do not promise uninterrupted service.',
        ],
      },
      {
        heading: 'Your content',
        body: [
          'You keep ownership of the logs and text you enter. You grant us a limited license to store, process, and display that content only to operate DailyMe for you, including sync, estimates, and insights you request.',
          'Do not enter content that is illegal, that you do not have the right to share, or that is intended to harm others.',
        ],
      },
      {
        heading: 'Acceptable use',
        body: [
          'Do not misuse DailyMe, attempt to break into accounts or systems, overload the service, scrape other users’ data, or use the app to provide medical care to others.',
          'We may suspend or delete an account that violates these Terms or creates risk for other users or the service.',
        ],
      },
      {
        heading: 'Accounts, passwords, and deletion',
        body: [
          'You may register with email and password or Google Sign-In. The same email cannot mix those methods.',
          `You may delete your account in the app or by following ${legalUrl('deleteAccount')}. Deletion removes your account and personal data as described in the Privacy Policy. It cannot be undone.`,
        ],
      },
      {
        heading: 'Notifications and permissions',
        body: [
          'Reminders, camera, photos, and location are optional. You can refuse Android permissions and still use typing-based features.',
          'You can disable notifications in DailyMe or in system settings.',
        ],
      },
      {
        heading: 'Third-party services',
        body: [
          'DailyMe uses Google Firebase, Google Sign-In, Vercel, and AI providers. Their terms also apply to the parts they provide. We are not responsible for outages or changes on those platforms.',
        ],
      },
      {
        heading: 'No medical advice and limitation of liability',
        body: [
          'DailyMe is provided “as is” for personal wellness tracking. Nutrition numbers and insights are estimates. We do not warrant that estimates are accurate or that the app will meet a particular health goal.',
          'To the fullest extent allowed by law, the DailyMe operator is not liable for indirect, incidental, or consequential damages, or for decisions you make based on logs or estimates. Our total liability for a claim relating to the app is limited to the amount you paid us for DailyMe in the 12 months before the claim, or zero if the app is free.',
          'Nothing in these Terms limits liability that cannot be limited under applicable law.',
        ],
      },
      {
        heading: 'Changes and termination',
        body: [
          'We may update these Terms by posting a new version with a new date. If you continue to use DailyMe after an update, you accept the new Terms where the law allows.',
          'You may stop using DailyMe and delete your account at any time. We may stop offering the app or a feature with reasonable notice when we can.',
        ],
      },
      {
        heading: 'Contact',
        body: [contact],
      },
    ],
  },
  support: {
    id: 'support',
    title: 'Support',
    summary: 'How to get help, report a problem, or ask about your account.',
    sections: [
      {
        heading: 'Contact',
        body: [
          `Email ${LEGAL.supportEmail} and include the Google account or email you use in DailyMe. We will not ask you for your password.`,
          `Public pages: Privacy Policy ${legalUrl('privacy')}, Terms ${legalUrl('terms')}, Delete account ${legalUrl('deleteAccount')}.`,
        ],
      },
      {
        heading: 'Common requests',
        body: [
          'Forgot password: use Forgot password on the sign-in screen. DailyMe sends a real reset email through Firebase.',
          'Change password: sign in with email and password, then open Profile.',
          'Export or delete data: Profile → Privacy & data.',
          'Google sign-in problems: make sure you are using the latest DailyMe install from the same Play or APK channel, and that Google Play services are up to date.',
        ],
      },
      {
        heading: 'Health',
        body: [HEALTH_DISCLAIMER],
      },
    ],
  },
  delete: {
    id: 'delete',
    title: 'Delete your DailyMe account',
    summary: 'Account deletion is permanent. It removes your DailyMe account and personal data from our systems.',
    sections: [
      {
        heading: 'Delete in the app',
        body: [
          '1. Open DailyMe and sign in.',
          '2. Go to Profile → Privacy & data, or open Delete account from Settings.',
          '3. Tap Delete account and data and confirm.',
          'DailyMe then deletes your Firebase account and the personal records stored for that account. You will be returned to the sign-in screen. This is not a simulated message.',
        ],
      },
      {
        heading: 'If you cannot open the app',
        body: [
          `Email ${LEGAL.supportEmail} from the same address as your DailyMe account and ask us to delete the account. We will verify that the request is yours before deleting.`,
        ],
      },
      {
        heading: 'What is removed',
        body: [
          'Your sign-in, profile, synced logs, meals, insights, device notification tokens, and related account documents.',
          'Meal photos are not kept as a library, so there is no photo archive to delete.',
          'We may retain a minimal record of the deletion request if the law requires it.',
        ],
      },
    ],
  },
  health: {
    id: 'health',
    title: 'Health and wellness disclaimer',
    summary: HEALTH_DISCLAIMER,
    sections: [
      {
        heading: 'Not medical care',
        body: [
          HEALTH_DISCLAIMER,
          'DailyMe does not offer diagnosis, treatment, or emergency services. If you think you are having a medical emergency, contact local emergency services.',
        ],
      },
    ],
  },
};

export function legalDoc(id: string | undefined): LegalDocument | null {
  if (!id || !(id in LEGAL_DOCS)) return null;
  return LEGAL_DOCS[id as LegalDocId];
}
