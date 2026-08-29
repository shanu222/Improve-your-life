import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Chip, Screen, Title } from '../src/components/ui';
import { TimeStepper } from '../src/components/TimeStepper';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

const ICONS = ['⭐', '📚', '💻', '💊', '🚶', '🙏', '📝', '🎧'];
const COLORS = ['#F5C518', '#7C6BF0', '#3B9EFF', '#34C759', '#FF6B9D', '#E85D4C'];

export default function HabitNew() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const run = useAppStore((s) => s.run);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('Daily');
  const [icon, setIcon] = useState('⭐');
  const [color, setColor] = useState('#F5C518');
  const [reminderTime, setReminder] = useState('18:00');

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Title theme={theme}>New habit</Title>
        <Body theme={theme}>Something small you want to repeat. No shame if you miss a day.</Body>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Read 20 pages"
          placeholderTextColor={theme.faint}
          accessibilityLabel="Habit name"
          style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 48 }}
        />
        <TextInput
          value={goal}
          onChangeText={setGoal}
          placeholder="Goal"
          placeholderTextColor={theme.faint}
          accessibilityLabel="Goal"
          style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 14, color: theme.ink, minHeight: 48 }}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ICONS.map((i) => (
            <Chip key={i} theme={theme} label={i} selected={icon === i} onPress={() => setIcon(i)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityLabel={`Color ${c}`}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: theme.ink }}
            />
          ))}
        </View>
        <TimeStepper theme={theme} label="Optional reminder" value={reminderTime} onChange={setReminder} />
        <Button
          theme={theme}
          label="Save habit"
          disabled={!name.trim()}
          onPress={async () => {
            await run((api, userId) =>
              api.upsertHabit(userId, {
                name,
                goal,
                icon,
                color,
                frequency: 'daily',
                enabled: true,
                isCustom: true,
                reminderTime,
              }),
            );
            router.back();
          }}
        />
      </ScrollView>
    </Screen>
  );
}
