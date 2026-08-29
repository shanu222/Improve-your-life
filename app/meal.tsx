import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Chip, Screen, Title } from '../src/components/ui';
import { searchFoods } from '../src/domain/foods';
import { parseMeal } from '../src/domain/mealParser';
import type { MealKind } from '../src/domain/types';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function MealScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<MealKind>((kindParam as MealKind) || 'breakfast');
  const [text, setText] = useState('');
  const logMeal = useAppStore((s) => s.logMeal);
  const suggestions = useMemo(() => searchFoods(text.split(/,| and /i).pop() ?? '', 6), [text]);
  const preview = useMemo(() => (text.trim() ? parseMeal(text) : null), [text]);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Title theme={theme}>Log a meal</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((k) => (
            <Chip key={k} theme={theme} label={k} selected={kind === k} onPress={() => setKind(k)} />
          ))}
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder='e.g. "2 eggs, 2 roti and tea"'
          placeholderTextColor={theme.faint}
          accessibilityLabel="What did you eat"
          multiline
          style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 16, minHeight: 96, color: theme.ink, fontSize: 16 }}
        />
        {suggestions.length > 0 && text.length > 1 ? (
          <View style={{ gap: 6 }}>
            {suggestions.map((food) => (
              <Pressable
                key={food.id}
                onPress={() => setText((curr) => {
                  const parts = curr.split(',');
                  parts[parts.length - 1] = (parts.length > 1 ? ' ' : '') + food.name;
                  return parts.join(',').replace(/^\s+/, '');
                })}
              >
                <Text style={{ color: theme.ink, fontWeight: '700' }}>{food.name} · {food.servingLabel}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {preview ? (
          <Card theme={theme} style={{ gap: 6 }}>
            <Text style={{ color: theme.ink, fontWeight: '800' }}>Estimate</Text>
            <Body theme={theme}>
              {Math.round(preview.calories)} kcal · {Math.round(preview.proteinG)}g protein · {Math.round(preview.carbsG)}g carbs · {Math.round(preview.fatG)}g fat
            </Body>
            {preview.unmatched.length ? <Body theme={theme}>Couldn’t match: {preview.unmatched.join(', ')}</Body> : null}
            <Body theme={theme} style={{ fontSize: 12 }}>Clearly an estimate based on your description.</Body>
          </Card>
        ) : null}
        <Button
          theme={theme}
          label="Save meal"
          disabled={!text.trim()}
          onPress={async () => {
            await logMeal(kind, text);
            router.back();
          }}
        />
      </ScrollView>
    </Screen>
  );
}
