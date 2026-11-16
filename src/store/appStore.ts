import { create } from 'zustand';
import { DailyService } from '../api/dailyService';
import { clearPersistedStore, loadPersistedStore } from '../db/persist';
import { toUserMessage, logInternalError } from '../domain/errors';
import type {
  AppSettings,
  CaffeineKind,
  EntryType,
  ExerciseKind,
  HygieneKind,
  LogEntry,
  MealKind,
  MoodKey,
  NotificationPreference,
  User,
  UserProfile,
} from '../domain/types';
import { firebaseConfigured } from '../firebase/client';
import { signOutCloud } from '../firebase/auth';
import { deleteCloudAccount } from '../firebase/accountCleanup';
import { safeCloudSync, syncNotificationPrefs, syncProfileToCloud } from '../firebase/sync';
import { clearSyncQueue, enqueueAndSync, flushCloudEntries } from '../firebase/queue';
import { apiPost } from '../lib/apiClient';
import { startFcmRuntime, stopFcmRuntime } from '../lib/fcmBootstrap';
import { unregisterPushForUser } from '../lib/push';
import { settleWithTimeout } from '../lib/timeout';

type Snapshot = Awaited<ReturnType<DailyService['todaySnapshot']>>;

function isLogEntry(value: unknown): value is LogEntry {
  return Boolean(value && typeof value === 'object' && 'id' in value && 'type' in value && 'payload' in value);
}

interface AppState {
  ready: boolean;
  booting: boolean;
  service: DailyService | null;
  user: User | null;
  profile: UserProfile | null;
  settings: AppSettings | null;
  notif: NotificationPreference | null;
  today: Snapshot | null;
  error: string | null;
  xpToast: { amount: number; reason: string } | null;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  run: <T>(fn: (api: DailyService, userId: string) => Promise<T>) => Promise<T | undefined>;
  completeOnboarding: (patch: Partial<UserProfile>) => Promise<void>;
  logWater: (ml: number) => Promise<void>;
  logSimple: (type: 'fruit' | 'vegetables' | 'junk' | 'sugary' | 'read' | 'relax') => Promise<void>;
  logHygiene: (kind: HygieneKind) => Promise<void>;
  logSmoking: () => Promise<void>;
  logAlcohol: (drinks?: number) => Promise<void>;
  logMood: (key: MoodKey, note?: string) => Promise<void>;
  logCaffeine: (kind: CaffeineKind) => Promise<void>;
  logExercise: (kind: ExerciseKind, minutes: number) => Promise<void>;
  logMeal: (kind: MealKind, text: string) => Promise<void>;
  logMealEstimate: (kind: MealKind, text: string, estimate: Record<string, unknown>) => Promise<void>;
  logSleep: (sleepTime: string, wakeTime: string) => Promise<void>;
  logScreen: (minutes: number) => Promise<void>;
  logBreak: (action: 'start' | 'complete', minutes?: number) => Promise<void>;
  logNote: (text: string) => Promise<void>;
  logActivity: (activity: string, description?: string) => Promise<void>;
  logFocus: (payload: { title: string; duration: number; status?: string; action: 'start' | 'complete' }) => Promise<void>;
  logWeather: (payload: { celsius?: number; condition?: string; feelingHot?: boolean }) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  updateNotifications: (patch: Partial<NotificationPreference>) => Promise<void>;
  setEmail: (email: string) => Promise<void>;
  linkCloudAccount: (patch: {
    firebaseUid?: string;
    email?: string;
    authProvider: 'google' | 'password' | 'local';
    emailVerified?: boolean;
  }) => Promise<void>;
  exportData: () => Promise<string | undefined>;
  deleteAllData: () => Promise<void>;
  signOutAccount: () => Promise<void>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  booting: false,
  service: null,
  user: null,
  profile: null,
  settings: null,
  notif: null,
  today: null,
  error: null,
  xpToast: null,

  hydrate: async () => {
    if (get().booting) return;
    set({ booting: true, error: null });
    try {
      const store = await Promise.race([
        loadPersistedStore(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('DailyMe took too long to open local data.')), 15000);
        }),
      ]);
      const service = new DailyService(store);
      const { user, profile, settings } = await service.bootstrap();
      const notif = await store.getNotificationPref(user.id);
      const today = await service.todaySnapshot(user.id);
      set({ ready: true, booting: false, service, user, profile, settings, notif, today, error: null });
      if (user.firebaseUid && firebaseConfigured()) {
        void startFcmRuntime(user.firebaseUid, Boolean(notif?.enabled));
        void safeCloudSync(async () => {
          await syncProfileToCloud(user.firebaseUid!, profile, user.email, {
            notificationEnabled: Boolean(notif?.enabled),
          });
          await flushCloudEntries(user.firebaseUid!, today.entries);
        });
      }
    } catch (error) {
      logInternalError('hydrate', error);
      set({ booting: false, ready: false, error: toUserMessage(error) });
    }
  },

  refresh: async () => {
    const { service, user } = get();
    if (!service || !user) return;
    try {
      const boot = await service.bootstrap();
      const today = await service.todaySnapshot(boot.user.id);
      set({
        user: boot.user,
        profile: boot.profile,
        settings: boot.settings,
        today,
        error: null,
      });
    } catch (error) {
      logInternalError('refresh', error);
      set({ error: toUserMessage(error) });
    }
  },

  run: async (fn) => {
    const { service, user } = get();
    if (!service || !user) return undefined;
    try {
      const result = await fn(service, user.id);
      const today = await service.todaySnapshot(user.id);
      const boot = await service.bootstrap();
      set({ today, profile: boot.profile, settings: boot.settings, user: boot.user, error: null });
      if (isLogEntry(result) && boot.user.firebaseUid) {
        void enqueueAndSync(boot.user.firebaseUid, result);
      } else if (boot.user.firebaseUid && boot.profile) {
        void safeCloudSync(() => syncProfileToCloud(boot.user.firebaseUid!, boot.profile, boot.user.email));
      }
      return result;
    } catch (error) {
      logInternalError('action', error);
      set({ error: toUserMessage(error) });
      return undefined;
    }
  },

  completeOnboarding: async (patch) => {
    await get().run((api, id) => api.completeOnboarding(id, patch));
  },

  logWater: async (ml) => {
    await get().run((api, id) => api.logWater(id, ml));
  },
  logSimple: async (type) => {
    await get().run((api, id) => api.logSimple(id, type));
  },
  logHygiene: async (kind) => {
    await get().run((api, id) => api.logHygiene(id, kind));
  },
  logSmoking: async () => {
    await get().run((api, id) => api.logSmoking(id, 1));
  },
  logAlcohol: async (drinks = 1) => {
    await get().run((api, id) => api.logAlcohol(id, drinks));
  },
  logMood: async (key, note) => {
    await get().run((api, id) => api.logMood(id, key, note));
  },
  logCaffeine: async (kind) => {
    await get().run((api, id) => api.logCaffeine(id, kind));
  },
  logExercise: async (kind, minutes) => {
    await get().run((api, id) => api.logExercise(id, kind, minutes));
  },
  logMeal: async (kind, text) => {
    await get().run((api, id) => api.logMeal(id, kind, text));
  },
  logMealEstimate: async (kind, text, estimate) => {
    await get().run((api, id) => api.logMealEstimate(id, kind, text, estimate));
  },
  logSleep: async (sleepTime, wakeTime) => {
    await get().run((api, id) => api.logSleep(id, sleepTime, wakeTime));
  },
  logScreen: async (minutes) => {
    await get().run((api, id) => api.logScreen(id, minutes));
  },
  logBreak: async (action, minutes) => {
    await get().run((api, id) => api.logBreak(id, action, minutes));
  },
  logNote: async (text) => {
    await get().run((api, id) => api.logNote(id, text));
  },
  logActivity: async (activity, description) => {
    await get().run((api, id) => api.logActivity(id, activity, description));
  },
  logFocus: async (payload) => {
    await get().run((api, id) => api.logFocus(id, payload));
  },
  logWeather: async (payload) => {
    await get().run((api, id) => api.logWeather(id, payload));
  },
  deleteEntry: async (entryId) => {
    await get().run((api, id) => api.deleteEntry(id, entryId));
  },
  updateProfile: async (patch) => {
    await get().run((api, id) => api.updateProfile(id, patch));
  },
  updateSettings: async (patch) => {
    await get().run((api, id) => api.updateSettings(id, patch));
  },
  updateNotifications: async (patch) => {
    await get().run(async (api, id) => {
      const next = await api.updateNotifications(id, patch);
      set({ notif: next });
      const uid = get().user?.firebaseUid;
      if (uid) {
        void safeCloudSync(() => syncNotificationPrefs(uid, next, get().profile?.timezone));
        void apiPost('/api/notifications/schedule', {
          enabled: next.enabled,
          quietHours: `${next.quietHoursStart}-${next.quietHoursEnd}`,
          categories: next.categories,
          timezone: get().profile?.timezone,
        }).catch((error) => logInternalError('notif.schedule', error));
      }
      return next;
    });
  },
  setEmail: async (email) => {
    await get().run((api, id) => api.setEmail(id, email));
  },
  linkCloudAccount: async (patch) => {
    await get().run((api, id) => api.linkCloudAccount(id, patch));
    const { user, profile, today } = get();
    if (user?.firebaseUid && profile) {
      void startFcmRuntime(user.firebaseUid, Boolean(get().notif?.enabled));
      void safeCloudSync(async () => {
        await syncProfileToCloud(user.firebaseUid!, profile, user.email, {
          notificationEnabled: Boolean(get().notif?.enabled),
        });
        await flushCloudEntries(user.firebaseUid!, today?.entries ?? []);
      });
    }
  },
  exportData: async () => {
    const result = await get().run(async (api, id) => JSON.stringify(await api.exportData(id), null, 2));
    return result;
  },
  deleteAllData: async () => {
    const { service, user } = get();
    if (!service || !user) throw new Error('DailyMe is not ready.');
    if (user.firebaseUid) {
      await settleWithTimeout(unregisterPushForUser(user.firebaseUid), 8000);
      await deleteCloudAccount();
      await signOutCloud();
    }
    stopFcmRuntime();
    await service.deleteAllData(user.id);
    await clearPersistedStore();
    await clearSyncQueue();
    set({
      user: null,
      profile: null,
      settings: null,
      notif: null,
      today: null,
      service: null,
      ready: false,
      booting: false,
      error: null,
    });
    await get().hydrate();
  },
  signOutAccount: async () => {
    const { service, user } = get();
    if (!service || !user) throw new Error('DailyMe is not ready.');
    if (user.firebaseUid) {
      await settleWithTimeout(unregisterPushForUser(user.firebaseUid), 8000);
    }
    await signOutCloud();
    stopFcmRuntime();
    const signedOut = await service.linkCloudAccount(user.id, {
      firebaseUid: undefined,
      authProvider: 'local',
      emailVerified: false,
    });
    set({ user: signedOut, error: null });
  },
  changePassword: async (currentPassword: string, nextPassword: string) => {
    const { changeCloudPassword } = await import('../firebase/auth');
    await changeCloudPassword(currentPassword, nextPassword);
  },
  clearError: () => set({ error: null }),
}));

export type { EntryType };
