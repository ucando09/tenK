import { Tabs } from 'expo-router';
import { Timer, BookOpen, History, Users } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

// Theme tokens for each color scheme
const THEME = {
  dark: {
    tabBarBg:          '#0d0d1f',
    tabBarBorder:      '#1e1e3a',
    tabBarActive:      '#7c6cf0',
    tabBarInactive:    '#555555',
    headerBg:          '#0d0d1f',
    headerBorder:      '#1e1e3a',
    headerTint:        '#ffffff',
  },
  light: {
    tabBarBg:          '#ffffff',
    tabBarBorder:      '#d8d8ee',
    tabBarActive:      '#7c6cf0',
    tabBarInactive:    '#7070a0',
    headerBg:          '#ffffff',
    headerBorder:      '#d8d8ee',
    headerTint:        '#0a0a20',
  },
} as const;

export default function TabsLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const t = THEME[scheme];

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor:   t.tabBarBg,
          borderTopColor:    t.tabBarBorder,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   t.tabBarActive,
        tabBarInactiveTintColor: t.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor:  t.headerBg,
          borderBottomColor: t.headerBorder,
          shadowColor:      'transparent',
          elevation: 0,
        },
        headerTintColor:      t.headerTint,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, size }) => <Timer size={size} color={color} />,
          headerTitle: 'tenK',
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
