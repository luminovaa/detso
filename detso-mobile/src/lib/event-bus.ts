/**
 * Master catalog of all application-wide event strings.
 * Centralized here to prevent typo-related bugs and ensure consistency.
 */
export const EVENTS = {
    // User module
    USER: {
        CREATED: 'user:created',
        UPDATED: 'user:updated',
        DELETED: 'user:deleted',
        REFRESH: 'user:refresh',
    },
  
    GLOBAL: {
        REFRESH_ALL: 'global:refresh-all',
        NETWORK_CHANGE: 'global:network-change',
    }
} as const;

/**
 * Type-safe payload mappings for the event bus.
 * Links each event string to its expected standardized data payload.
 */
type EventMap = {
    [EVENTS.USER.CREATED]: { userId?: string };
    [EVENTS.USER.UPDATED]: { userId: string };
    [EVENTS.USER.DELETED]: { userId: string };
    [EVENTS.USER.REFRESH]: { filter?: string };

    // Global events
    [EVENTS.GLOBAL.REFRESH_ALL]: { reason?: string };
    [EVENTS.GLOBAL.NETWORK_CHANGE]: { isConnected: boolean };
};

type EventCallback<T = any> = (data?: T) => void;

/**
 * Global Event Bus singleton managing application-wide pub/sub communication.
 * Provides a type-safe interface over a standard observer pattern.
 */
class EventBus {
    private events: Map<string, EventCallback[]> = new Map();

    subscribe<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>) {
        if (!this.events.has(event)) this.events.set(event, []);
        this.events.get(event)!.push(callback);
        return () => {
            const callbacks = this.events.get(event) || [];
            this.events.set(event, callbacks.filter(cb => cb !== callback));
        };
    }

    once<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>) {
        const unsubscribe = this.subscribe(event, (data) => {
            callback(data);
            unsubscribe();
        });
        return unsubscribe;
    }

    emit<K extends keyof EventMap>(event: K, data?: EventMap[K]) {
        if (__DEV__) console.log(`[EventBus] ${event}`, data);
        const callbacks = this.events.get(event);
        if (callbacks) {
            callbacks.forEach(cb => {
                try { cb(data); }
                catch (error) { console.error(`[EventBus] Error in ${event}:`, error); }
            });
        }
    }

    hasListeners(event: keyof EventMap) {
        return (this.events.get(event)?.length ?? 0) > 0;
    }

    clear(event: keyof EventMap) { this.events.delete(event); }
    clearAll() { this.events.clear(); }
}
export const eventBus = new EventBus();