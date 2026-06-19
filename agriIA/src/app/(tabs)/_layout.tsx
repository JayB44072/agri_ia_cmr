import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import {
  useColorScheme,
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { name: 'index',     title: 'Accueil',   icon: 'home-outline' as const,        iconFilled: 'home' as const },
  { name: 'parcelles', title: 'Parcelles', icon: 'map-outline' as const,          iconFilled: 'map' as const },
  { name: 'marche',    title: 'Marché',    icon: 'storefront-outline' as const,   iconFilled: 'storefront' as const },
  { name: 'meteo',     title: 'Météo',     icon: 'partly-sunny-outline' as const, iconFilled: 'partly-sunny' as const },
  { name: 'profil',    title: 'Profil',    icon: 'person-outline' as const,       iconFilled: 'person' as const },
];

const TAB_COUNT = TABS.length;
const BAR_H     = 64;
const PILL_H    = 48;
const PILL_VPAD = (BAR_H - PILL_H) / 2; // 8px top & bottom

const PRIMARY = '#22c55e';

// ── Theme tokens ──────────────────────────────────────────────────────────────
const THEME = {
  light: {
    bar:         '#ffffff',
    barBorder:   'rgba(34,197,94,0.22)',
    shadowColor: '#d1fae5',
    labelActive: PRIMARY,
    labelIdle:   '#94a3b8',
    iconActive:  '#ffffff',
    iconIdle:    '#94a3b8',
    pill:        PRIMARY,
    pillShadow:  'rgba(34,197,94,0.40)',
    outerBg:     '#f0fdf4',
    outerBorder: 'rgba(34,197,94,0.10)',
  },
  dark: {
    bar:         'rgba(15,23,42,0.97)',
    barBorder:   'rgba(34,197,94,0.18)',
    shadowColor: 'rgba(34,197,94,0.30)',
    labelActive: '#ffffff',
    labelIdle:   'rgba(255,255,255,0.40)',
    iconActive:  '#ffffff',
    iconIdle:    'rgba(255,255,255,0.38)',
    pill:        PRIMARY,
    pillShadow:  'rgba(34,197,94,0.60)',
    outerBg:     'transparent',
    outerBorder: 'transparent',
  },
};

// ── Ink pill ──────────────────────────────────────────────────────────────────
function InkPill({
  activeIndex,
  pillWidth,
  pillShadow,
}: {
  activeIndex: number;
  pillWidth:   number;
  pillShadow:  string;
}) {
  const translateX = useSharedValue(activeIndex * pillWidth);
  const scaleX     = useSharedValue(1);
  const prevIndex  = useRef(activeIndex);

  useEffect(() => {
    const from = prevIndex.current;
    const to   = activeIndex;
    if (from === to) return;
    prevIndex.current = to;

    const delta = Math.abs(to - from);

    // 1) stretch toward target, then snap back
    scaleX.value = withSequence(
      withTiming(1 + 0.5 * delta, { duration: 150, easing: Easing.out(Easing.quad) }),
      withTiming(1,                { duration: 270, easing: Easing.out(Easing.back(2.6)) })
    );

    // 2) slide with spring overshoot
    translateX.value = withSpring(to * pillWidth, {
      damping:           13,
      stiffness:         155,
      mass:              0.75,
      overshootClamping: false,
    });
  }, [activeIndex, pillWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform:  [{ translateX: translateX.value }, { scaleX: scaleX.value }],
    width:      pillWidth,
    shadowColor: pillShadow,
  }));

  return (
    <Animated.View
      style={[
        styles.inkPill,
        { top: PILL_VPAD, height: PILL_H, backgroundColor: PRIMARY },
        pillStyle,
      ]}
    />
  );
}

// ── Single tab button ─────────────────────────────────────────────────────────
function TabButton({
  tab,
  focused,
  theme,
  pillWidth,
  badgeCount,
  onPress,
}: {
  tab:        (typeof TABS)[0];
  focused:    boolean;
  theme:      typeof THEME.light;
  pillWidth:  number;
  badgeCount?: number;
  onPress:    () => void;
}) {
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      iconScale.value = withSequence(
        withTiming(1.30, { duration: 85 }),
        withSpring(1, { damping: 10, stiffness: 320 })
      );
    }
  }, [focused]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(34,197,94,0.15)', borderless: true, radius: 28 }}
      // exact column width & full bar height → Pressable fills the column
      style={{ width: pillWidth, height: BAR_H, zIndex: 10 }}
    >
      {/* Centred absolutely inside the full column so icon sits in pill */}
      <View style={styles.tabInner}>
        <Animated.View style={iconAnimStyle}>
          <Ionicons
            name={focused ? tab.iconFilled : tab.icon}
            size={22}
            color={focused ? theme.iconActive : theme.iconIdle}
          />
        </Animated.View>

        <Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            {
              color:      focused ? theme.labelActive : theme.labelIdle,
              fontWeight: focused ? '800' : '500',
            },
          ]}
        >
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

// ── Custom tab bar ────────────────────────────────────────────────────────────
function AgriTabBar({
  state,
  descriptors,
  navigation,
}: {
  state:       any;
  descriptors: any;
  navigation:  any;
}) {
  const scheme = useColorScheme();
  const theme  = scheme === 'dark' ? THEME.dark : THEME.light;

  const [barWidth, setBarWidth] = React.useState(SCREEN_WIDTH - 20);
  const pillWidth = barWidth / TAB_COUNT;

  return (
    <View
      style={[
        styles.outerWrap,
        {
          backgroundColor: theme.outerBg,
          borderTopColor:  theme.outerBorder,
        },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.bar,
            borderColor:     theme.barBorder,
            shadowColor:     theme.shadowColor,
            height:          BAR_H,
          },
        ]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {/* Ink pill — z-index 0, sits behind icons */}
        <InkPill
          activeIndex={state.index}
          pillWidth={pillWidth}
          pillShadow={theme.pillShadow}
        />

        {/* Tab buttons — z-index 10, on top */}
        {state.routes.map((route: any, idx: number) => {
          const tab     = TABS.find((t) => t.name === route.name) ?? TABS[0];
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
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// ── Root layout ───────────────────────────────────────────────────────────────
export default function AppTabs(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => <AgriTabBar {...props} />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerWrap: {
    paddingHorizontal: 10,
    paddingBottom:     14,
    paddingTop:        4,
    borderTopWidth:    1,
  },

  tabBar: {
    flexDirection: 'row',
    borderRadius:  20,
    borderWidth:   1,
    overflow:      'hidden',
    position:      'relative',
    // shadow
    shadowOffset:  { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius:  16,
    elevation:     18,
  },

  // Sliding pill (absolutely positioned, behind icons)
  inkPill: {
    position:      'absolute',
    left:          0,
    borderRadius:  13,
    zIndex:        0,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius:  10,
    elevation:     6,
  },

  // Fills the full column height so the Pressable hit area = column
  // Icon + label are centred within it
  tabInner: {
    flex:           1,
    width:          '100%',
    height:         BAR_H,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
    position:       'relative',
  },

  tabLabel: {
    fontSize:      9,
    letterSpacing: 0.3,
    textAlign:     'center',
  },

  badge: {
    position:          'absolute',
    top:               6,
    right:             8,
    minWidth:          16,
    height:            16,
    borderRadius:      8,
    backgroundColor:   '#ef4444',
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
    borderWidth:       1.5,
  },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
});
