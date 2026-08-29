import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Card, EmptyState, Screen, Title, TonePill } from '../../src/components/ui';
import { HEALTH_DISCLAIMER } from '../../src/domain/types';
import { buildNutritionDashboard } from '../../src/domain/nutrition';
import { useAppStore } from '../../src/store/appStore';
import { useAppTheme } from '../../src/theme';

export default function NutritionScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const today = useAppStore((s) => s.today);
  const profile = useAppStore((s) => s.profile);
  const dash = buildNutritionDashboard(today?.entries ?? [], profile?.calorieEstimate ?? 2000);

  return (
    <Screen theme={theme}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, padding: 18, gap: 14, paddingBottom: 40 }}>
        <Title theme={theme}>{"Today's nutrition"}</Title>
        <Body theme={theme}>Estimates based on what you logged — not lab-level accuracy.</Body>

        {!dash.hasMeals ? (
          <EmptyState
            theme={theme}
            emoji="🍽"
            title="Nothing logged yet."
            body="Add your first meal to see today's nutrition."
          />
        ) : (
          <>
            <Card theme={theme} style={{ gap: 8 }}>
              <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>Calories</Text>
              <Text style={{ color: theme.ink, fontSize: 28, fontWeight: '800' }}>
                {Math.round(dash.calories.amount).toLocaleString()} / estimated {dash.calories.target.toLocaleString()}
              </Text>
              <TonePill theme={theme} tone={dash.calories.tone} label="Estimate from logged food" />
            </Card>
            {dash.macros.map((row) => (
              <Card key={row.key} theme={theme} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ color: theme.ink, fontWeight: '800' }}>{row.label}</Text>
                  <TonePill theme={theme} tone={row.tone} label={`${Math.round(row.amount)}${row.unit}`} />
                </View>
                <Text style={{ color: theme.muted }}>{row.target}{row.unit} guidance</Text>
              </Card>
            ))}
            <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>Micronutrients</Text>
            {dash.micros.map((row) => (
              <Card key={row.key} theme={theme} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.ink, fontWeight: '800' }}>{row.label}</Text>
                  <Text style={{ color: theme.muted }}>
                    {Math.round(row.amount)} / {row.target} {row.unit}
                  </Text>
                </View>
                <TonePill theme={theme} tone={row.tone} label={row.tone === 'good' ? 'Good' : row.tone === 'almost' ? 'Could improve' : 'Low based on logged food'} />
                {row.message ? <Body theme={theme}>{row.message}</Body> : null}
                {row.suggestion ? <Body theme={theme}>{row.suggestion}</Body> : null}
              </Card>
            ))}
            {dash.suggestions.length > 0 ? (
              <Card theme={theme} style={{ gap: 8 }}>
                <Text style={{ color: theme.ink, fontWeight: '800' }}>You may want to add one of these today:</Text>
                {dash.suggestions.map((s) => (
                  <Text key={s.label} style={{ color: theme.ink, fontSize: 16 }}>
                    {s.emoji} {s.label}
                  </Text>
                ))}
              </Card>
            ) : null}
          </>
        )}
        <Body theme={theme} style={{ fontSize: 12 }}>{HEALTH_DISCLAIMER}</Body>
      </ScrollView>
    </Screen>
  );
}
