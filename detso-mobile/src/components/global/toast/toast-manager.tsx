// src/components/ui/toast/toast-manager.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { Animated } from "react-native";
import { ToastContent } from "./tosat-content";

export type ToastType = "success" | "error" | "info" | "warning";
export type ToastPosition = "top" | "bottom";

export interface ToastOptions {
  type?: ToastType;
  position?: ToastPosition;
  duration?: number;
  onPress?: () => void;
  onPressAutoHide?: boolean;
}

export interface ToastData extends ToastOptions {
  id: string;
  title: string;
  message?: string;
  timestamp: number;
  type: ToastType;
}

interface ToastContextValue {
  show: (title: string, message?: string, options?: ToastOptions) => string;
  hide: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Singleton instance manager for orchestrating application-wide toast notifications.
 * Manages active toast state array and notifies subscribed React components on updates.
 */
class ToastManager {
  private toasts: ToastData[] = [];
  private listeners: ((toasts: ToastData[]) => void)[] = [];

  show(title: string, message?: string, options: ToastOptions = {}): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastData = {
      id,
      title,
      message,
      timestamp: Date.now(),
      type: options.type || "info",
      position: options.position || "top",
      duration: options.duration ?? 3000,
      onPress: options.onPress,
      onPressAutoHide: options.onPressAutoHide ?? true,
    };

    this.toasts = [...this.toasts, toast];
    this.notifyListeners();

    if (toast.duration! > 0) {
      setTimeout(() => this.hide(id), toast.duration);
    }

    return id;
  }

  hide(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notifyListeners();
  }

  clear() {
    this.toasts = [];
    this.notifyListeners();
  }

  subscribe(listener: (toasts: ToastData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l([...this.toasts]));
  }
}

export const toastManager = new ToastManager();

/**
 * Context Provider component that constructs the foundational boundaries and injects the toast management API into the React tree.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  const value: ToastContextValue = {
    show: (title, message, options) =>
      toastManager.show(title, message, options),
    hide: (id) => toastManager.hide(id),
    clear: () => toastManager.clear(),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
        <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

/**
 * Stacked toast container.
 * Latest toast is on top (front), older toasts stack behind with decreasing scale/opacity.
 */
function ToastContainer({ toasts }: { toasts: ToastData[] }) {
  const topToasts = toasts.filter((t) => t.position === "top");
  const bottomToasts = toasts.filter((t) => t.position === "bottom");

  return (
    <>
      <StackedGroup toasts={topToasts} position="top" />
      <StackedGroup toasts={bottomToasts} position="bottom" />
    </>
  );
}

/**
 * Renders toasts in a stacked formation.
 * The newest toast (last in array) is fully visible on top.
 * Older toasts peek behind with scale-down + slight vertical offset + reduced opacity.
 * Max 3 visible in stack.
 */
function StackedGroup({
  toasts,
  position,
}: {
  toasts: ToastData[];
  position: "top" | "bottom";
}) {
  if (toasts.length === 0) return null;

  // Show max 3 toasts in the stack (newest last)
  const maxVisible = 3;
  const visibleToasts = toasts.slice(-maxVisible);
  const total = visibleToasts.length;

  return (
    <>
      {visibleToasts.map((toast, i) => {
        // i=0 is oldest visible, i=total-1 is newest (front)
        const reverseIndex = total - 1 - i; // 0 = front, 1 = behind, 2 = furthest back
        return (
          <ToastItem
            key={toast.id}
            toast={toast}
            stackIndex={reverseIndex}
            position={position}
          />
        );
      })}
    </>
  );
}

/**
 * Individually animated toast with stacked positioning.
 * stackIndex: 0 = front (newest), 1 = behind, 2 = furthest back
 */
function ToastItem({
  toast,
  stackIndex,
  position,
}: {
  toast: ToastData;
  stackIndex: number;
  position: "top" | "bottom";
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(
    new Animated.Value(position === "top" ? -30 : 30),
  ).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate stack position changes
  const stackScale = useRef(new Animated.Value(1)).current;
  const stackTranslateY = useRef(new Animated.Value(0)).current;
  const stackOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scale down for items behind: 1.0, 0.95, 0.90
    const targetScale = 1 - stackIndex * 0.05;
    // Offset behind items slightly: 0, 8, 16 (top) or 0, -8, -16 (bottom)
    const targetOffset = position === "top"
      ? stackIndex * 8
      : -(stackIndex * 8);
    // Reduce opacity for items behind: 1.0, 0.7, 0.4
    const targetOpacity = Math.max(1 - stackIndex * 0.3, 0.4);

    Animated.parallel([
      Animated.spring(stackScale, {
        toValue: targetScale,
        friction: 10,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.spring(stackTranslateY, {
        toValue: targetOffset,
        friction: 10,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(stackOpacity, {
        toValue: targetOpacity,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stackIndex, position]);

  const handlePress = () => {
    if (toast.onPress) toast.onPress();
    if (toast.onPressAutoHide !== false) toastManager.hide(toast.id);
  };

  // zIndex: front toast gets highest
  const zIndex = 9999 - stackIndex;

  return (
    <Animated.View
      style={[
        itemBaseStyle,
        position === "top" ? { top: 52 } : { bottom: 52 },
        {
          zIndex,
          opacity: Animated.multiply(opacity, stackOpacity),
          transform: [
            { translateY: Animated.add(translateY, stackTranslateY) },
            { scale: Animated.multiply(scale, stackScale) },
          ],
        },
      ]}
    >
      <ToastContent
        toast={toast}
        onPress={handlePress}
        duration={toast.duration ?? 3000}
      />
    </Animated.View>
  );
}

const itemBaseStyle = {
  position: "absolute",
  left: 16,
  right: 16,
} as const;

/**
 * Custom React hook establishing immediate access to the context-based toast notification controls.
 * Throws a runtime error if executed outside the `ToastProvider` hierarchy boundaries.
 *
 * @returns A strictly typed `ToastContextValue` providing `show`, `hide`, and `clear` routines.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
