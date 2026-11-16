import { Redirect, Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { firebaseConfigured } from '../../src/firebase/client';
import { useAppStore } from '../../src/store/appStore';
import { useAppTheme } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const ready = useAppStore((s) => s.ready);
  const uid = useAppStore((s) => s.user?.firebaseUid);

  if (ready && firebaseConfigured() && !uid) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tab,
          borderTopColor: theme.line,
          height: 62 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.faint,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="☀️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🔥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🥗" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="✨" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

function TabEmoji({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{ opacity: focused ? 1 : 0.55, transform: [{ scale: focused ? 1.05 : 1 }] }}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </View>
  );
}
