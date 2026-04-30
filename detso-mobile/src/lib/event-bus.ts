/**
 * Unified Event Bus — Single source of truth for all application-wide events.
 *
 * Replaces the old `auth-events.ts` and `features/auth/event.ts` (both now deprecated).
 * Every domain module registers its events here so we get:
 *   - Consistent naming (domain:action)
 *   - Type-safe payloads via EventMap
 *   - Autocomplete in every IDE
 */

// ─── Event Catalog ───────────────────────────────────────────────
export const EVENTS = {
  AUTH: {
    SESSION_EXPIRED: 'auth:session_expired',
    TOKEN_REFRESHED: 'auth:token_refreshed',
    SERVER_ERROR: 'auth:server_error',
    LOGIN_SUCCESS: 'auth:login_success',
    LOGOUT: 'auth:logout',
  },

  USER: {
    CREATED: 'user:created',
    UPDATED: 'user:updated',
    DELETED: 'user:deleted',
    PASSWORD_CHANGED: 'user:password_changed',
    REFRESH: 'user:refresh',
  },

  CUSTOMER: {
    CREATED: 'customer:created',
    UPDATED: 'customer:updated',
    DELETED: 'customer:deleted',
    REFRESH: 'customer:refresh',
  },

  TICKET: {
    CREATED: 'ticket:created',
    UPDATED: 'ticket:updated',
    STATUS_CHANGED: 'ticket:status_changed',
    ASSIGNED: 'ticket:assigned',
    DELETED: 'ticket:deleted',
    REFRESH: 'ticket:refresh',
  },

  PACKAGE: {
    CREATED: 'package:created',
    UPDATED: 'package:updated',
    DELETED: 'package:deleted',
    REFRESH: 'package:refresh',
  },

  SCHEDULE: {
    CREATED: 'schedule:created',
    UPDATED: 'schedule:updated',
    DELETED: 'schedule:deleted',
    REFRESH: 'schedule:refresh',
  },

  TENANT: {
    CREATED: 'tenant:created',
    UPDATED: 'tenant:updated',
    DELETED: 'tenant:deleted',
    REFRESH: 'tenant:refresh',
  },

  SERVICE: {
    CREATED: 'service:created',
    UPDATED: 'service:updated',
    DELETED: 'service:deleted',
    REFRESH: 'service:refresh',
  },

  DASHBOARD: {
    REFRESH: 'dashboard:refresh',
  },

  GLOBAL: {
    REFRESH_ALL: 'global:refresh_all',
    NETWORK_CHANGE: 'global:network_change',
    CACHE_INVALIDATED: 'global:cache_invalidated',
  },
} as const;

// ─── Payload Types ───────────────────────────────────────────────
export type EventMap = {
  // Auth
  [EVENTS.AUTH.SESSION_EXPIRED]: undefined;
  [EVENTS.AUTH.TOKEN_REFRESHED]: undefined;
  [EVENTS.AUTH.SERVER_ERROR]: { message?: string };
  [EVENTS.AUTH.LOGIN_SUCCESS]: { userId: string };
  [EVENTS.AUTH.LOGOUT]: undefined;

  // User
  [EVENTS.USER.CREATED]: { userId: string };
  [EVENTS.USER.UPDATED]: { userId: string };
  [EVENTS.USER.DELETED]: { userId: string };
  [EVENTS.USER.PASSWORD_CHANGED]: undefined;
  [EVENTS.USER.REFRESH]: { filter?: string };

  // Customer
  [EVENTS.CUSTOMER.CREATED]: { customerId: string };
  [EVENTS.CUSTOMER.UPDATED]: { customerId: string };
  [EVENTS.CUSTOMER.DELETED]: { customerId: string };
  [EVENTS.CUSTOMER.REFRESH]: { filter?: string };

  // Ticket
  [EVENTS.TICKET.CREATED]: { ticketId: string; customerId?: string };
  [EVENTS.TICKET.UPDATED]: { ticketId: string };
  [EVENTS.TICKET.STATUS_CHANGED]: { ticketId: string; status: string };
  [EVENTS.TICKET.ASSIGNED]: { ticketId: string; technicianId: string };
  [EVENTS.TICKET.DELETED]: { ticketId: string };
  [EVENTS.TICKET.REFRESH]: { filter?: string };

  // Package
  [EVENTS.PACKAGE.CREATED]: { packageId: string };
  [EVENTS.PACKAGE.UPDATED]: { packageId: string };
  [EVENTS.PACKAGE.DELETED]: { packageId: string };
  [EVENTS.PACKAGE.REFRESH]: { filter?: string };

  // Schedule
  [EVENTS.SCHEDULE.CREATED]: { scheduleId: string };
  [EVENTS.SCHEDULE.UPDATED]: { scheduleId: string };
  [EVENTS.SCHEDULE.DELETED]: { scheduleId: string };
  [EVENTS.SCHEDULE.REFRESH]: { filter?: string };

  // Tenant
  [EVENTS.TENANT.CREATED]: { tenantId: string };
  [EVENTS.TENANT.UPDATED]: { tenantId: string };
  [EVENTS.TENANT.DELETED]: { tenantId: string };
  [EVENTS.TENANT.REFRESH]: { filter?: string };

  // Service Connection
  [EVENTS.SERVICE.CREATED]: { serviceId: string; customerId?: string };
  [EVENTS.SERVICE.UPDATED]: { serviceId: string };
  [EVENTS.SERVICE.DELETED]: { serviceId: string; customerId?: string };
  [EVENTS.SERVICE.REFRESH]: { filter?: string };

  // Dashboard
  [EVENTS.DASHBOARD.REFRESH]: { reason?: string };

  // Global
  [EVENTS.GLOBAL.REFRESH_ALL]: { reason?: string };
  [EVENTS.GLOBAL.NETWORK_CHANGE]: { isConnected: boolean };
  [EVENTS.GLOBAL.CACHE_INVALIDATED]: { keys?: string[] };
};

// ─── Core Types ──────────────────────────────────────────────────
type EventCallback<T = unknown> = (data: T) => void;

// ─── EventBus Class ──────────────────────────────────────────────
class EventBus {
  private events: Map<string, EventCallback<any>[]> = new Map();

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  subscribe<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<EventMap[K]>,
  ) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event)!.push(callback);

    return () => {
      const callbacks = this.events.get(event) || [];
      this.events.set(
        event,
        callbacks.filter((cb) => cb !== callback),
      );
    };
  }

  /**
   * Subscribe once — auto-unsubscribes after the first invocation.
   */
  once<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<EventMap[K]>,
  ) {
    const unsubscribe = this.subscribe(event, (data) => {
      callback(data);
      unsubscribe();
    });
    return unsubscribe;
  }

  /**
   * Emit an event to all registered listeners.
   */
  emit<K extends keyof EventMap>(event: K, ...args: EventMap[K] extends undefined ? [] : [EventMap[K]]) {
    if (__DEV__) console.log(`[EventBus] ${event}`, args[0] ?? '');

    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(args[0] as EventMap[K]);
        } catch (error) {
          console.error(`[EventBus] Error in handler for "${event}":`, error);
        }
      });
    }
  }

  /** Check whether any listeners are registered for a given event. */
  hasListeners(event: keyof EventMap) {
    return (this.events.get(event)?.length ?? 0) > 0;
  }

  /** Remove all listeners for a specific event. */
  clear(event: keyof EventMap) {
    this.events.delete(event);
  }

  /** Remove every listener across all events. */
  clearAll() {
    this.events.clear();
  }
}

export const eventBus = new EventBus();
