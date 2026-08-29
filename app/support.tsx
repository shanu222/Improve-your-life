import { Linking, Pressable, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Card, Screen, Title } from '../src/components/ui';
import { LegalLinks } from '../src/components/LegalDocument';
import { LEGAL } from '../src/legal/config';
import { LEGAL_DOCS } from '../src/legal/documents';
import { useAppTheme } from '../src/theme';

export default function SupportRoute() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const doc = LEGAL_DOCS.support;

  return (
    <Screen theme={theme}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          padding: 20,
          gap: 14,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text>
        </Pressable>
        <Title theme={theme}>{doc.title}</Title>
        <Body theme={theme}>{doc.summary}</Body>
        {doc.sections.map((section) => (
          <Card theme={theme} key={section.heading} style={{ gap: 8 }}>
            <Text style={{ color: theme.ink, fontWeight: '800', fontSize: 18 }}>{section.heading}</Text>
            {section.body.map((para) => (
              <Body theme={theme} key={para.slice(0, 48)}>
                {para}
              </Body>
            ))}
          </Card>
        ))}
        <Button
          theme={theme}
          label={`Email ${LEGAL.supportEmail}`}
          onPress={() => void Linking.openURL(`mailto:${LEGAL.supportEmail}?subject=DailyMe%20support`)}
        />
        <LegalLinks compact />
      </ScrollView>
    </Screen>
  );
}
