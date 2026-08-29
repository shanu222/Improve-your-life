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
  MealKind,
  MoodKey,
  NotificationPreference,
  User,
  UserProfile,
} from '../domain/types';

type Snapshot = Awaited<ReturnType<DailyService['todaySnapshot']>>;

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
  logMood: (key: MoodKey, note?: string) => Promise<void>;
  logCaffeine: (kind: CaffeineKind) => Promise<void>;
  logExercise: (kind: ExerciseKind, minutes: number) => Promise<void>;
  logMeal: (kind: MealKind, text: string) => Promise<void>;
  logSleep: (sleepTime: string, wakeTime: string) => Promise<void>;
  logScreen: (minutes: number) => Promise<void>;
  logBreak: (action: 'start' | 'complete', minutes?: number) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  updateNotifications: (patch: Partial<NotificationPreference>) => Promise<void>;
  setEmail: (email: string) => Promise<void>;
  exportData: () => Promise<string | undefined>;
  deleteAllData: () => Promise<void>;
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
      const store = await loadPersistedStore();
      const service = new DailyService(store);
      const { user, profile, settings } = await service.bootstrap();
      const notif = await store.getNotificationPref(user.id);
      const today = await service.todaySnapshot(user.id);
      set({ ready: true, booting: false, service, user, profile, settings, notif, today });
    } catch (error) {
      logInternalError('hydrate', error);
      set({ booting: false, ready: true, error: toUserMessage(error) });
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
  logSleep: async (sleepTime, wakeTime) => {
    await get().run((api, id) => api.logSleep(id, sleepTime, wakeTime));
  },
  logScreen: async (minutes) => {
    await get().run((api, id) => api.logScreen(id, minutes));
  },
  logBreak: async (action, minutes) => {
    await get().run((api, id) => api.logBreak(id, action, minutes));
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
      return next;
    });
  },
  setEmail: async (email) => {
    await get().run((api, id) => api.setEmail(id, email));
  },
  exportData: async () => {
    const result = await get().run(async (api, id) => JSON.stringify(await api.exportData(id), null, 2));
    return result;
  },
  deleteAllData: async () => {
    const { service, user } = get();
    if (!service || !user) return;
    await service.deleteAllData(user.id);
    await clearPersistedStore();
    set({
      user: null,
      profile: null,
      settings: null,
      notif: null,
      today: null,
      service: null,
      ready: false,
    });
    await get().hydrate();
  },
  clearError: () => set({ error: null }),
}));

export type { EntryType };
