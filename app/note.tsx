import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { noteResponse } from '../src/domain/notesSafety';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function NoteScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const logNote = useAppStore((s) => s.logNote);
  const [text, setText] = useState('');
  const [reply, setReply] = useState<ReturnType<typeof noteResponse> | null>(null);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Title theme={theme}>How are you feeling?</Title>
        <Body theme={theme}>DailyMe can track how you feel. It cannot diagnose medical conditions.</Body>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="I have a headache."
          placeholderTextColor={theme.faint}
          multiline
          accessibilityLabel="Note"
          style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 16, minHeight: 120, color: theme.ink }}
        />
        <Button
          theme={theme}
          label="Save note"
          disabled={!text.trim()}
          onPress={async () => {
            await logNote(text);
            setReply(noteResponse(text));
          }}
        />
        {reply ? (
          <Card theme={theme}>
            <Body theme={theme}>{reply.reply}</Body>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
