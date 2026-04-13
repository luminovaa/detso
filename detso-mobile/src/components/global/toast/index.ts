import { toastManager } from './toast-manager';

export { ToastProvider, useToast } from './toast-manager';

export const showToast = {
  success: (title: string, message?: string) =>
    toastManager.show(title, message, { type: 'success', duration: 3000 }),
  error: (title: string, message?: string) =>
    toastManager.show(title, message, { type: 'error', duration: 4000 }),
  info: (title: string, message?: string) =>
    toastManager.show(title, message, { type: 'info', duration: 3000 }),
  warning: (title: string, message?: string) =>
    toastManager.show(title, message, { type: 'warning', duration: 3500 }),
};