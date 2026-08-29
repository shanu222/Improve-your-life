# DailyMe Google Play Console answers

Use these values in Play Console. They match the live policies and the app’s real behavior.

## Store listing URLs

Paste these after the site has deployed (usually a few minutes after push):

- Privacy policy: https://improve-your-life-ten.vercel.app/privacy-policy
- Terms of service: https://improve-your-life-ten.vercel.app/terms
- Support: https://improve-your-life-ten.vercel.app/support
- Account deletion: https://improve-your-life-ten.vercel.app/delete-account

Support email: shahnawaz9974balouch@gmail.com  
Package name: `app.daily.wellness`  
App name: DailyMe

## App category and audience

- Category: Health & Fitness
- Target age: 18 and older
- Designed for children: No
- Families policy: Not participating / not directed at children
- Ads: No ads in the app
- In-app products: None unless you add paid products later
- Medical claims: No. DailyMe is wellness tracking, not diagnosis or treatment.

## Data safety form

Data collected: Yes  
Data shared with other companies for advertising: No  
Data sold: No  
Users can request deletion: Yes  
Encryption in transit: Yes (HTTPS)

Declare these types as collected, used for App functionality and Account management. Mark as not sold and not used for advertising.

| Type | Collected | Optional | Notes |
| --- | --- | --- | --- |
| Email address | Yes | Required for account | Firebase Authentication |
| Name | Yes | Optional | Profile |
| User IDs | Yes | Required | Firebase UID |
| Health info | Yes | User-entered | Sleep, meals, mood, habits, water, exercise, notes you log |
| Photos | Processed only | Optional | Meal estimate, then discarded. Do not mark as stored if Play lets you say processed and not kept |
| Approximate location | Yes | Optional | Only if the user asks for weather fill |
| App activity | Yes | Required to sync | Logs and insights for that user |
| Device or other IDs | Yes | Optional | FCM token if reminders are on |

Do **not** declare: financial info, contacts, SMS, calendar, audio, web browsing, advertising ID, precise location as always-on.

Third-party processors (not “sold”): Google Firebase (Auth, Firestore, FCM), Google Sign-In, Vercel (APIs), AI providers for meal photos and insights the user requests.

## Permissions justifications

- Camera / photos: optional meal estimate. Photo is not stored.
- Notifications: optional reminders.
- Boot completed / vibrate: so scheduled reminders can work.
- Internet: account, sync, estimates.
- Location (if Play shows it): optional weather only.

## Account deletion (Play policy)

In-app path: Profile → Privacy & data → Delete account and data.  
Store listing URL: https://improve-your-life-ten.vercel.app/delete-account

## Content rating

Answer the IARC questionnaire honestly:

- No user-generated public social feed
- No violence, gambling, or sexual content
- Users can type private notes (not published to others)
- Digital purchases: only if you later add them

## What reviewers will check

1. Privacy policy URL loads without a login.
2. Policy describes account data, health-style logs, photos, notifications, and deletion.
3. Creating an account requires agreeing to Terms and Privacy Policy and being 18+.
4. Delete account actually removes the Firebase user and stored records.
