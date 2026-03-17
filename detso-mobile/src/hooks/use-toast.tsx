import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "default" | "success" | "destructive" | "warning";

export interface ToastProps {
    id: string;
    title: string;
    description?: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextType {
    toasts: ToastProps[]; // Tambahkan ini agar UI bisa membaca daftar toast
    toast: (options: Omit<ToastProps, "id">) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast harus digunakan di dalam ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const toast = useCallback((options: Omit<ToastProps, "id">) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [{ id, ...options }, ...prev]);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value= {{ toasts, toast, dismiss }
}>
    { children }
    </ToastContext.Provider>
  );
};