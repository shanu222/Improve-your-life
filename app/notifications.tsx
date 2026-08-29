import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { TimeStepper } from '../src/components/TimeStepper';
import { getPushDiagnostics, registerPushForUser } from '../src/lib/push';
import {
  getNotificationPermissionStatus,
  openSystemNotificationSettings,
  requestNotificationPermission,
  syncScheduledReminders,
} from '../src/lib/notifications';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';
import type { NotificationCategories, ReminderMode } from '../src/domain/types';
import { defaultNotificationPref } from '../src/domain/defaults';

export default function NotificationsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const notif = useAppStore((s) => s.notif);
  const profile = useAppStore((s) => s.profile);
  const service = useAppStore((s) => s.service);
  const user = useAppStore((s) => s.user);
  const updateNotifications = useAppStore((s) => s.updateNotifications);
  const [osPermission, setOsPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [diag, setDiag] = useState<string>('');

  useEffect(() => {
    void getNotificationPermissionStatus().then(setOsPermission);
  }, []);

  const apply = async (enabled: boolean) => {
    if (enabled) {
      const current = await getNotificationPermissionStatus();
      const ok = current === 'granted' ? true : current === 'denied' ? false : await requestNotificationPermission();
      await updateNotifications({ enabled: ok });
      if (!ok) {
        setOsPermission(await getNotificationPermissionStatus());
        return;
      }
      if (service && user && profile) {
        const plan = await service.reminderPlan(user.id);
        await syncScheduledReminders(plan, profile, true, { preferRemoteEngine: Boolean(user.firebaseUid) });
        if (user.firebaseUid) void registerPushForUser(user.firebaseUid);
      }
      setOsPermission('granted');
      return;
    }
    await updateNotifications({ enabled: false });
    if (profile) await syncScheduledReminders([], profile, false);
  };

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Title theme={theme}>Notifications</Title>
        <Body theme={theme}>DailyMe uses reminders to help you stay on track with meals, water, hygiene, mood, sleep and daily habits.</Body>
        <Body theme={theme}>DailyMe never spams. Completed items are skipped. Quiet hours are respected. Nothing is sent if reminders are off.</Body>
        <Card theme={theme}>
          <Text style={{ color: theme.ink, fontWeight: '800' }}>Permission</Text>
          <Body theme={theme}>
            {osPermission === 'denied'
              ? 'Notifications are turned off in Android settings. DailyMe still works — enable them there if you want reminders.'
              : notif?.enabled
                ? 'Reminders are on for this device.'
                : 'Reminders are off. DailyMe will not send notifications.'}
          </Body>
        </Card>
        {osPermission === 'denied' ? (
          <Button theme={theme} label="Open notification settings" onPress={() => void openSystemNotificationSettings()} />
        ) : (
          <Button
            theme={theme}
            label={notif?.enabled ? 'Reminders on' : 'Enable reminders'}
            onPress={() => void apply(!(notif?.enabled))}
          />
        )}
        <Card theme={theme} style={{ gap: 12 }}>
          <Text style={{ color: theme.ink, fontWeight: '800' }}>How often</Text>
          {(['minimal', 'balanced', 'helpful'] as ReminderMode[]).map((mode) => (
            <Pressable key={mode} onPress={() => void updateNotifications({ reminderMode: mode })}>
              <Text style={{ color: notif?.reminderMode === mode ? theme.accent : theme.ink, fontWeight: '700', textTransform: 'capitalize' }}>
                {mode}
              </Text>
            </Pressable>
          ))}
        </Card>
        <TimeStepper
          theme={theme}
          label="Quiet hours start"
          value={notif?.quietHoursStart ?? '22:30'}
          onChange={(v) => void updateNotifications({ quietHoursStart: v })}
        />
        <TimeStepper
          theme={theme}
          label="Quiet hours end"
          value={notif?.quietHoursEnd ?? '07:00'}
          onChange={(v) => void updateNotifications({ quietHoursEnd: v })}
        />
        <Card theme={theme}>
          <Text style={{ color: theme.ink, fontWeight: '800' }}>Snooze</Text>
          <Body theme={theme}>{notif?.snoozeMinutes ?? 15} minutes</Body>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {[10, 15, 30, 60].map((n) => (
              <Button key={n} theme={theme} variant="soft" label={`${n}m`} onPress={() => void updateNotifications({ snoozeMinutes: n })} />
            ))}
          </View>
        </Card>
        <Card theme={theme} style={{ gap: 10 }}>
          <Text style={{ color: theme.ink, fontWeight: '800' }}>Categories</Text>
          {(
            [
              ['morning', 'Morning'],
              ['breakfast', 'Breakfast'],
              ['lunch', 'Lunch'],
              ['dinner', 'Dinner'],
              ['water', 'Water'],
              ['break', 'Breaks'],
              ['mood', 'Mood'],
              ['sleep', 'Sleep'],
              ['endOfDay', 'End of day'],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => {
                const current = notif?.categories ?? defaultNotificationPref(user?.id ?? 'local').categories;
                void updateNotifications({
                  categories: { ...current, [key]: !current[key] } satisfies NotificationCategories,
                });
              }}
            >
              <Text style={{ color: theme.ink, fontWeight: '700' }}>
                {label}: {notif?.categories?.[key] === false ? 'Off' : 'On'}
              </Text>
            </Pressable>
          ))}
        </Card>
        {__DEV__ ? (
          <Card theme={theme} style={{ gap: 8 }}>
            <Text style={{ color: theme.ink, fontWeight: '800' }}>Diagnostics (dev)</Text>
            <Button
              theme={theme}
              variant="soft"
              label="Check notification status"
              onPress={() => {
                void getPushDiagnostics(user?.firebaseUid).then((d) => {
                  setDiag(
                    [
                      `permission: ${d.permission}`,
                      `token: ${d.tokenPresent ? `…${d.tokenSuffix}` : 'no'}`,
                      `signed in: ${d.authenticated ? 'yes' : 'no'}`,
                      `platform: ${d.platform}`,
                    ].join('\n'),
                  );
                });
              }}
            />
            {diag ? <Body theme={theme}>{diag}</Body> : null}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
