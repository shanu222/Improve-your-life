import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Chip, Screen, Title } from '../src/components/ui';
import { searchFoods } from '../src/domain/foods';
import type { FoodVisionResult } from '../src/domain/foodVision';
import { parseMeal } from '../src/domain/mealParser';
import { toUserMessage } from '../src/domain/errors';
import type { MealKind } from '../src/domain/types';
import { apiPost } from '../src/lib/apiClient';
import { useAppStore } from '../src/store/appStore';
import { useAppTheme } from '../src/theme';

export default function MealScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<MealKind>((kindParam as MealKind) || 'breakfast');
  const [text, setText] = useState('');
  const [vision, setVision] = useState<FoodVisionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const logMeal = useAppStore((s) => s.logMeal);
  const logMealEstimate = useAppStore((s) => s.logMealEstimate);
  const suggestions = useMemo(() => searchFoods(text.split(/,| and /i).pop() ?? '', 6), [text]);
  const preview = useMemo(() => (text.trim() ? parseMeal(text) : null), [text]);

  const analyzeAsset = async (base64: string | undefined) => {
    if (!base64) {
      setPhotoError('DailyMe could not read that photo. Try another one.');
      return;
    }
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    const analyzed = await apiPost<FoodVisionResult>('/api/food/analyze', { imageBase64: dataUrl, hint: text });
    setVision(analyzed);
    if (analyzed.mealType) setKind(analyzed.mealType);
    if (!text.trim() && analyzed.foodItems.length) {
      setText(analyzed.foodItems.map((f) => f.name).join(', '));
    }
  };

  const takePhoto = async () => {
    setPhotoError(null);
    setBusy(true);
    try {
      const ImagePicker = await import('expo-image-picker');
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPhotoError('Camera access is needed to take a meal photo. Enable it in Android settings if you want to use the camera.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.4, base64: true });
      if (result.canceled) return;
      await analyzeAsset(result.assets[0]?.base64 ?? undefined);
      if (result.assets[0]) result.assets[0].base64 = undefined;
    } catch (error) {
      setPhotoError(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const choosePhoto = async () => {
    setPhotoError(null);
    setBusy(true);
    try {
      const ImagePicker = await import('expo-image-picker');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoError('Photo library access is needed to upload a meal photo. Enable it in Android settings if you want to choose a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.4,
        base64: true,
      });
      if (result.canceled) return;
      await analyzeAsset(result.assets[0]?.base64 ?? undefined);
      if (result.assets[0]) result.assets[0].base64 = undefined;
    } catch (error) {
      setPhotoError(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen theme={theme}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, padding: 20, gap: 14, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Title theme={theme}>Log a meal</Title>
        <Body theme={theme}>Photos are processed only to estimate nutrition, then discarded. DailyMe does not store food photographs.</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((k) => (
            <Chip key={k} theme={theme} label={k} selected={kind === k} onPress={() => setKind(k)} />
          ))}
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder='e.g. "2 eggs, 1 paratha and tea"'
          placeholderTextColor={theme.faint}
          accessibilityLabel="What did you eat"
          multiline
          style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 16, minHeight: 96, color: theme.ink, fontSize: 16 }}
        />
        <Button theme={theme} variant="soft" label={busy ? 'Estimating…' : 'Take photo'} disabled={busy} onPress={() => void takePhoto()} />
        <Button theme={theme} variant="soft" label={busy ? 'Estimating…' : 'Upload / choose photo'} disabled={busy} onPress={() => void choosePhoto()} />
        {photoError ? (
          <Card theme={theme} style={{ gap: 8 }}>
            <Body theme={theme}>{photoError}</Body>
            <Pressable onPress={() => void Linking.openSettings()} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ color: theme.accent, fontWeight: '700' }}>Open Android settings</Text>
            </Pressable>
          </Card>
        ) : null}
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
        {vision ? (
          <Card theme={theme} style={{ gap: 8 }}>
            <Text style={{ color: theme.ink, fontWeight: '800' }}>Photo estimate</Text>
            <Body theme={theme}>{vision.foodItems.map((f) => f.name).join(', ') || 'Meal'}</Body>
            <Field theme={theme} label="kcal" value={String(vision.estimatedCalories)} onChange={(v) => setVision({ ...vision, estimatedCalories: Number(v) || 0 })} />
            <Field theme={theme} label="Protein g" value={String(vision.protein)} onChange={(v) => setVision({ ...vision, protein: Number(v) || 0 })} />
            <Field theme={theme} label="Carbs g" value={String(vision.carbs)} onChange={(v) => setVision({ ...vision, carbs: Number(v) || 0 })} />
            <Field theme={theme} label="Fat g" value={String(vision.fat)} onChange={(v) => setVision({ ...vision, fat: Number(v) || 0 })} />
            <Body theme={theme} style={{ fontSize: 12 }}>These are estimates based on the photo and portion size.</Body>
          </Card>
        ) : preview ? (
          <Card theme={theme} style={{ gap: 6 }}>
            <Text style={{ color: theme.ink, fontWeight: '800' }}>Estimate</Text>
            <Body theme={theme}>
              {Math.round(preview.calories)} kcal · {Math.round(preview.proteinG)}g protein · {Math.round(preview.carbsG)}g carbs · {Math.round(preview.fatG)}g fat
            </Body>
            {preview.unmatched.length ? <Body theme={theme}>Couldn’t match: {preview.unmatched.join(', ')}</Body> : null}
            <Body theme={theme} style={{ fontSize: 12 }}>Clearly an estimate based on your description.</Body>
          </Card>
        ) : null}
        {saveError ? <Body theme={theme}>{saveError}</Body> : null}
        <Button
          theme={theme}
          label={saving ? 'Saving…' : 'Save meal'}
          disabled={!text.trim() || saving || busy}
          onPress={async () => {
            setSaveError(null);
            setSaving(true);
            try {
              if (vision) {
                await logMealEstimate(kind, text, {
                  calories: vision.estimatedCalories,
                  proteinG: vision.protein,
                  carbsG: vision.carbs,
                  fatG: vision.fat,
                  fiberG: vision.fiber ?? 0,
                  items: vision.foodItems,
                  isEstimate: true,
                  confidence: vision.confidence,
                });
                setVision(null);
              } else {
                await logMeal(kind, text);
              }
              router.back();
            } catch (error) {
              setSaveError(toUserMessage(error));
            } finally {
              setSaving(false);
            }
          }}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({
  theme,
  label,
  value,
  onChange,
}: {
  theme: ReturnType<typeof useAppTheme>;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ color: theme.muted, width: 90 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        accessibilityLabel={label}
        style={{ flex: 1, backgroundColor: theme.surface2, borderRadius: 12, padding: 10, color: theme.ink, minHeight: 44 }}
      />
    </View>
  );
}
