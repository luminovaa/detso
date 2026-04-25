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
 * Utilizes `@gorhom/portal` to float dynamic toast instances above all other UI elements natively.
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
 * Internal container responsible for segregating and rendering mapped toast arrays based on designated screen positions.
 */
function ToastContainer({ toasts }: { toasts: ToastData[] }) {
  const topToasts = toasts.filter((t) => t.position === "top");
  const bottomToasts = toasts.filter((t) => t.position === "bottom");

  return (
    <>
      {topToasts.map((toast, index) => (
        <ToastItem key={toast.id} toast={toast} index={index} position="top" />
      ))}
      {bottomToasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          position="bottom"
        />
      ))}
    </>
  );
}

/**
 * Individually animated toast component handling continuous entry and exit springs, opacities, and positioning offsets.
 */
function ToastItem({
  toast,
  index,
  position,
}: {
  toast: ToastData;
  index: number;
  position: "top" | "bottom";
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(
    new Animated.Value(position === "top" ? -20 : 20),
  ).current;

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
    ]).start();
  }, []);

  const handlePress = () => {
    if (toast.onPress) toast.onPress();
    if (toast.onPressAutoHide !== false) toastManager.hide(toast.id);
  };

  const offset = index * 76; // 68px toast height + 8px gap

  return (
    <Animated.View
      style={[
        itemBaseStyle,
        position === "top" ? { top: 52 + offset } : { bottom: 52 + offset },
        { opacity, transform: [{ translateY }] },
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
  zIndex: 9999,
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
