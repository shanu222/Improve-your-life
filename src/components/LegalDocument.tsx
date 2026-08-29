import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LEGAL } from '../legal/config';
import { type LegalDocId, LEGAL_DOCS } from '../legal/documents';
import { useAppTheme } from '../theme';
import { Body, Card, Screen, Title } from './ui';

export function LegalDocumentScreen({ docId }: { docId: LegalDocId }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const doc = LEGAL_DOCS[docId];

  return (
    <Screen theme={theme}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
          gap: 14,
        }}
      >
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text>
        </Pressable>
        <Title theme={theme}>{doc.title}</Title>
        <Body theme={theme}>Last updated {LEGAL.effectiveDate}</Body>
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
      </ScrollView>
    </Screen>
  );
}

export function LegalLinks({ compact }: { compact?: boolean }) {
  const theme = useAppTheme();
  const links = [
    { label: 'Privacy Policy', href: '/privacy-policy' as const },
    { label: 'Terms of Service', href: '/terms' as const },
    { label: 'Support', href: '/support' as const },
    { label: 'Delete account', href: '/delete-account' as const },
  ];
  return (
    <View style={{ gap: compact ? 4 : 8 }}>
      {links.map((link) => (
        <Pressable
          key={link.href}
          onPress={() => router.push(link.href)}
          accessibilityRole="link"
          accessibilityLabel={link.label}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: theme.accent, fontWeight: '700' }}>{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
