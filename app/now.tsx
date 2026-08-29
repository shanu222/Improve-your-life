import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Chip, Screen, Title } from '../src/components/ui';
import { coachForNowText, NOW_ACTIVITIES } from '../src/domain/nowActivity';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function NowScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const logActivity = useAppStore((s) => s.logActivity);
  const [picked, setPicked] = useState<string>('working');
  const [text, setText] = useState('');
  const [reply, setReply] = useState<ReturnType<typeof coachForNowText> | null>(null);

  const save = async () => {
    const description = text.trim() || picked;
    await logActivity(picked, description);
    setReply(coachForNowText(description));
  };

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Title theme={theme}>What are you doing right now?</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {NOW_ACTIVITIES.map((item) => (
            <Chip key={item.id} theme={theme} emoji={item.emoji} label={item.label} selected={picked === item.id} onPress={() => setPicked(item.id)} />
          ))}
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="I'm working on my project but I don't feel like working."
          placeholderTextColor={theme.faint}
          multiline
          accessibilityLabel="What you're doing"
          style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 16, minHeight: 96, color: theme.ink }}
        />
        <Button theme={theme} label="Save check-in" onPress={() => void save()} />
        {reply ? (
          <Card theme={theme} style={{ gap: 12 }}>
            <Body theme={theme}>{reply.reply}</Body>
            {reply.offerFocus ? (
              <>
                <Button theme={theme} label="Start 10-minute focus" onPress={() => router.replace({ pathname: '/focus', params: { minutes: '10' } })} />
                <Button theme={theme} variant="soft" label="Take a break" onPress={() => router.replace({ pathname: '/check-in', params: { type: 'break' } })} />
                <Button theme={theme} variant="ghost" label="I'm okay" onPress={() => router.back()} />
              </>
            ) : (
              <Button theme={theme} variant="ghost" label="I'm okay" onPress={() => router.back()} />
            )}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
