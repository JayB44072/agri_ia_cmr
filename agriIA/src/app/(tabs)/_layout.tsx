import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Text,
  Animated,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { name: 'index',      title: 'Accueil',    icon: 'home-outline' as const,       iconFilled: 'home' as const },
  { name: 'parcelles',  title: 'Parcelles',  icon: 'map-outline' as const,         iconFilled: 'map' as const },
  { name: 'diagnostic', title: 'Diagnostic', icon: 'scan-outline' as const,         iconFilled: 'scan' as const },
  { name: 'marche',     title: 'Marché',     icon: 'storefront-outline' as const,   iconFilled: 'storefront' as const },
  { name: 'meteo',      title: 'Météo',      icon: 'partly-sunny-outline' as const, iconFilled: 'partly-sunny' as const },
  { name: 'menu',       title: 'Plus',       icon: 'apps-outline' as const,         iconFilled: 'apps' as const },
];

const TAB_COUNT = TABS.length;
const BAR_H     = 64;
const PILL_H    = 48;
const PILL_VPAD = (BAR_H - PILL_H) / 2;
const PRIMARY   = '#2e7d32';

const THEME = {
  light: {
    bar: '#ffffff', barBorder: 'rgba(46,125,50,0.22)', shadowColor: '#d1fae5',
    labelActive: PRIMARY, labelIdle: '#94a3b8',
    iconActive: '#ffffff', iconIdle: '#94a3b8',
    pill: PRIMARY, pillShadow: 'rgba(46,125,50,0.40)',
    outerBg: '#f0fdf4', outerBorder: 'rgba(46,125,50,0.10)',
  },
  dark: {
    bar: 'rgba(15,23,42,0.97)', barBorder: 'rgba(46,125,50,0.18)', shadowColor: 'rgba(46,125,50,0.30)',
    labelActive: '#ffffff', labelIdle: 'rgba(255,255,255,0.40)',
    iconActive: '#ffffff', iconIdle: 'rgba(255,255,255,0.38)',
    pill: PRIMARY, pillShadow: 'rgba(46,125,50,0.60)',
    outerBg: 'transparent', outerBorder: 'transparent',
  },
};

function InkPill({ activeIndex, pillWidth, pillShadow }: { activeIndex: number; pillWidth: number; pillShadow: string }) {
  const translateX = useRef(new Animated.Value(activeIndex * pillWidth)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: activeIndex * pillWidth,
      damping: 13,
      stiffness: 155,
      mass: 0.75,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, pillWidth]);

  return (
    <Animated.View
      style={[
        styles.inkPill,
        { top: PILL_VPAD, height: PILL_H, backgroundColor: PRIMARY, shadowColor: pillShadow },
        { width: pillWidth, transform: [{ translateX }] },
      ]}
    />
  );
}

function TabButton({ tab, focused, theme, pillWidth, badgeCount, onPress }: {
  tab: (typeof TABS)[0];
  focused: boolean;
  theme: typeof THEME.light;
  pillWidth: number;
  badgeCount?: number;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 85, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, damping: 10, stiffness: 320, useNativeDriver: true }),
      ]).start();
    }
  }, [focused]);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(46,125,50,0.15)', borderless: true, radius: 28 }}
      style={{ width: pillWidth, height: BAR_H, zIndex: 10 }}
    >
      <View style={styles.tabInner}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons
            name={focused ? tab.iconFilled : tab.icon}
            size={22}
            color={focused ? theme.iconActive : theme.iconIdle}
          />
        </Animated.View>
        <Text numberOfLines={1} style={[styles.tabLabel, { color: focused ? theme.labelActive : theme.labelIdle, fontWeight: focused ? '800' : '500' }]}>
          {tab.title}
        </Text>
        {!!badgeCount && badgeCount > 0 && (
          <View style={[styles.badge, { borderColor: theme.bar }]}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function AgriTabBar({ state, descriptors, navigation }: { state: any; descriptors: any; navigation: any }) {
  const { isDark } = useAppTheme();
  const theme = isDark ? THEME.dark : THEME.light;
  const [barWidth, setBarWidth] = React.useState(SCREEN_WIDTH - 20);
  const pillWidth = barWidth / TAB_COUNT;

  const currentRouteName = state.routes[state.index]?.name;
  const visualIndex = TABS.findIndex((t) => t.name === currentRouteName);
  const activePillIndex = visualIndex >= 0 ? visualIndex : 0;

  return (
    <View style={[styles.outerWrap, { backgroundColor: theme.outerBg, borderTopColor: theme.outerBorder }]}>
      <View
        style={[styles.tabBar, { backgroundColor: theme.bar, borderColor: theme.barBorder, shadowColor: theme.shadowColor, height: BAR_H }]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        <InkPill activeIndex={activePillIndex} pillWidth={pillWidth} pillShadow={theme.pillShadow} />

        {state.routes.map((route: any, idx: number) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === idx;
          const { options } = descriptors[route.key];
          return (
            <TabButton
              key={route.key}
              tab={tab}
              focused={focused}
              theme={theme}
              pillWidth={pillWidth}
              badgeCount={options.badgeCount}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function AppTabs(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      tabBar={(props) => <AgriTabBar {...props} />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
      <Tabs.Screen name="profil"       options={{ title: 'Mon Profil',   href: null }} />
      <Tabs.Screen name="calendrier"   options={{ title: 'Calendrier',   href: null }} />
      <Tabs.Screen name="wallet"       options={{ title: 'Portefeuille', href: null }} />
      <Tabs.Screen name="finances"     options={{ title: 'Finances',     href: null }} />
      <Tabs.Screen name="harvests"     options={{ title: 'Récoltes',     href: null }} />
      <Tabs.Screen name="cooperatives" options={{ title: 'Coopératives', href: null }} />
      <Tabs.Screen name="chat"         options={{ title: 'Messagerie',   href: null }} />
      <Tabs.Screen name="sensors"      options={{ title: 'Capteurs IoT', href: null }} />
      <Tabs.Screen name="settings"     options={{ title: 'Paramètres',   href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outerWrap: { paddingHorizontal: 10, paddingBottom: 14, paddingTop: 4, borderTopWidth: 1 },
  tabBar: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, overflow: 'hidden', position: 'relative', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 1, shadowRadius: 16, elevation: 18 },
  inkPill: { position: 'absolute', left: 0, borderRadius: 13, zIndex: 0, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10, elevation: 6 },
  tabInner: { flex: 1, width: '100%', height: BAR_H, alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative' },
  tabLabel: { fontSize: 9, letterSpacing: 0.3, textAlign: 'center' },
  badge: { position: 'absolute', top: 6, right: 8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5 },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
});
