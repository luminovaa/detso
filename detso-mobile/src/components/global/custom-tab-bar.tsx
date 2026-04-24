import React, { useEffect, useMemo } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import { useColorScheme } from "nativewind";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useAuthStore } from "@/src/features/auth/store";
import { useTabBarHeight, TAB_BAR_HEIGHT } from "@/src/hooks/use-tab-bar-height";

interface TabItemProps {
  isFocused: boolean;
  iconName: any;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  tokens: any;
}

const TabItem = ({
  isFocused,
  iconName,
  label,
  onPress,
  onLongPress,
  tokens,
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

  const buttonStyle = useAnimatedStyle(() => {
    return {
      flex: activeWidth.value + 1,
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
    <Animated.View
      className="items-center justify-center h-full"
      style={buttonStyle}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onLongPress={onLongPress}
        className="py-2.5 w-full"
      >
        <View className="flex-row items-center justify-center h-[50px] px-4 rounded-[25px] overflow-hidden">
          <Animated.View
            className="absolute inset-0 rounded-[25px]"
            style={bgStyle}
          />

          <Ionicons
            name={isFocused ? iconName : `${iconName}-outline`}
            size={24}
            color={isFocused ? tokens.primary : tokens.uiMuted}
            style={{ zIndex: 1 }}
          />

          {isFocused && (
            <Animated.Text
              className="text-[13px] ml-2"
              style={[
                textStyle,
                {
                  color: tokens.primary,
                  zIndex: 1,
                  fontFamily: "SF-Pro-Bold",
                },
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
  const { tabBarBottom } = useTabBarHeight();
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const TOKENS = useMemo(
    () => ({
      primary: isDark ? "hsl(217, 100%, 70%)" : "hsl(217, 71%, 22%)",
      primaryLight: isDark
        ? "hsla(217, 100%, 70%, 0.15)"
        : "hsla(217, 71%, 22%, 0.15)",
      uiMuted: isDark ? "hsl(220, 10%, 70%)" : "hsl(220, 10%, 50%)",
      bgOverlay: isDark
        ? "rgba(10, 10, 10, 0.85)"
        : "rgba(255, 255, 255, 0.85)",
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.08)",
    }),
    [isDark],
  );

  return (
    <View
      className="absolute left-5 right-5 rounded-[35px] flex-row items-center justify-between px-2 overflow-hidden border"
      style={{
        height: TAB_BAR_HEIGHT,
        bottom: tabBarBottom,
        borderColor: TOKENS.borderColor,
        backgroundColor:
          Platform.OS === "android"
            ? isDark
              ? "#121212"
              : "#ffffff"
            : "transparent",
        // Shadows
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { height: 10, width: 0 },
        shadowRadius: 15,
      }}
    >
      <BlurView
        intensity={100}
        tint={isDark ? "dark" : "light"}
        className="absolute inset-0"
      />

      <View
        className="absolute inset-0"
        style={{ backgroundColor: TOKENS.bgOverlay }}
      />

      {state.routes
        .filter((route) => {
          if (user?.role === "SAAS_SUPER_ADMIN") {
            if (route.name === "schedule" || route.name === "map") {
              return false;
            }
          } else {
            if (route.name === "isp") {
              return false;
            }
          }

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