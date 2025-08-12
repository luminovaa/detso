"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/api/auth.api";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  exp: number;
  profile: {
    id: string;
    full_name: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: {
    identifier: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Clear timeout helper
  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Stable logout function
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Clear refresh timeout
      clearRefreshTimeout();

      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsLoading(false);

      // Broadcast logout to other tabs
      try {
        const authChannel = new BroadcastChannel("auth_channel");
        authChannel.postMessage("logout");
        authChannel.close();
      } catch (error) {
        console.error("BroadcastChannel error:", error);
      }

      // Navigate to login
      router.push("/admin/sign-in");
    }
  }, [clearRefreshTimeout, router]);

  // Stable refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log("Attempting to refresh token...");
      await authService.refreshToken();
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        console.log("Token refreshed successfully");
        return true;
      } else {
        throw new Error("Failed to get user after refresh");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      await handleLogout();
      return false;
    }
  }, [handleLogout]);

  // Stable login function
  const handleLogin = useCallback(async (credentials: {
    identifier: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result) {
        const { accessToken, refreshToken, ...userData } = result;
        setUser(userData);
      } else {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Token refresh scheduler - moved to useEffect to avoid dependency issues
  useEffect(() => {
    if (!user?.exp) return;

    const startTokenRefresh = (exp: number) => {
      clearRefreshTimeout();
      
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = exp - currentTime;
      const refreshTime = Math.max(timeUntilExpiry - 120, 30);
      const delay = refreshTime * 1000;

      console.log(`Setting token refresh in ${refreshTime} seconds`);

      if (delay > 0) {
        refreshTimeoutRef.current = setTimeout(async () => {
          const success = await refreshToken();
          if (success) {
            const updatedUser = await authService.getCurrentUser();
            if (updatedUser?.exp) {
              startTokenRefresh(updatedUser.exp);
            }
          }
        }, delay);
      } else {
        refreshToken();
      }
    };

    startTokenRefresh(user.exp);

    return () => {
      clearRefreshTimeout();
    };
  }, [user?.exp, refreshToken, clearRefreshTimeout]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // First try to verify session
        const sessionCheck = await authService.verifySession();
        if (sessionCheck) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Broadcast channel for multi-tab logout
  useEffect(() => {
    let authChannel: BroadcastChannel;
    
    try {
      authChannel = new BroadcastChannel("auth_channel");

      authChannel.onmessage = (event) => {
        if (event.data === "logout") {
          setUser(null);
          clearRefreshTimeout();
          router.push("/admin/sign-in");
        }
      };
    } catch (error) {
      console.error("BroadcastChannel not supported:", error);
    }

    return () => {
      if (authChannel) {
        authChannel.close();
      }
    };
  }, [router, clearRefreshTimeout]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo((): AuthContextType => ({
    user,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated: !!user,
    refreshToken,
  }), [user, isLoading, handleLogin, handleLogout, refreshToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};