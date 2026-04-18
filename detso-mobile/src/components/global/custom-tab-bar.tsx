import React, { useEffect, useMemo } from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useColorScheme } from "nativewind";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useAuthStore } from "@/src/features/auth/store";

// Tokens akan dipindahkan ke dalam komponen agar dinamis

interface TabItemProps {
  isFocused: boolean;
  iconName: any;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  tokens: any; // Tambahkan tokens prop
}

const TabItem = ({
  isFocused,
  iconName,
  label,
  onPress,
  onLongPress,
  tokens, // Destructure tokens
}: TabItemProps) => {
  const activeWidth = useSharedValue(isFocused ? 1 : 0);
  const opacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    activeWidth.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  // ✅ 2. FIX REANIMATED CRASH (Menggunakan activeWidth untuk flex, bukan width: 'auto')
  const buttonStyle = useAnimatedStyle(() => {
    return {
      flex: activeWidth.value + 1, // Akan mulus berubah dari flex 1 (kecil) ke flex 2 (lebar)
    };
  });

  const bgStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isFocused ? tokens.primaryLight : "transparent",
      opacity: opacity.value,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.tabItemWrapper, buttonStyle]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.touchableArea}
      >
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.activeBackground,
              bgStyle,
            ]}
          />

          <Ionicons
            name={isFocused ? iconName : `${iconName}-outline`}
            size={24}
            color={isFocused ? tokens.primary : tokens.uiMuted}
            style={{ zIndex: 1 }}
          />

          {isFocused && (
            <Animated.Text
              style={[
                styles.tabLabel,
                textStyle,
                { color: tokens.primary, zIndex: 1 },
              ]}
              numberOfLines={1}
            >
              {label}
            </Animated.Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const TOKENS = useMemo(() => ({
    primary: isDark ? "hsl(217, 100%, 70%)" : "hsl(217, 71%, 22%)",
    primaryLight: isDark ? "hsla(217, 100%, 70%, 0.15)" : "hsla(217, 71%, 22%, 0.15)",
    uiMuted: isDark ? "hsl(220, 10%, 70%)" : "hsl(220, 10%, 50%)",
    bgOverlay: isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)",
    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
  }), [isDark]);

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          bottom: insets.bottom > 0 ? insets.bottom : 20,
          borderColor: TOKENS.borderColor,
        },
      ]}
    >
      <BlurView
        intensity={100}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFillObject}
      />

      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: TOKENS.bgOverlay },
        ]}
      />

      {state.routes
        .filter((route) => {
          if (user?.role === "SAAS_SUPER_ADMIN") {
            if (route.name === "schedule" || route.name === "map") {
              return false;
            }
          } 
          else {
            if (route.name === "isp") {
              return false;
            }
          }

          // 3. Fallback bawaan Expo
          const href = (descriptors[route.key].options as any).href;
          if (href === null) return false;

          return true;
        })
        .map((route) => {
          const { options } = descriptors[route.key];

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === state.routes.indexOf(route);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          let iconName = "grid";
          if (route.name === "schedule") iconName = "calendar";
          if (route.name === "isp") iconName = "cube";
          if (route.name === "map") iconName = "map";
          if (route.name === "settings") iconName = "settings";

            return (
              <TabItem
                key={route.key}
                isFocused={isFocused}
                iconName={iconName}
                label={label as string}
                onPress={onPress}
                onLongPress={onLongPress}
                tokens={TOKENS}
              />
            );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    overflow: "hidden",

    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { height: 10, width: 0 },
    shadowRadius: 15,

    backgroundColor:
      Platform.OS === "android" ? "rgba(255,255,255,0.1)" : "transparent",
  },
  tabItemWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  touchableArea: {
    paddingVertical: 10,
    width: "100%",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 25,
    overflow: "hidden",
  },
  activeBackground: {
    borderRadius: 25,
  },
  tabLabel: {
    fontFamily: "SF-Pro-Bold", 
    fontSize: 13,
    marginLeft: 8,
  },
});