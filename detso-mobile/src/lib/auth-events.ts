type EventType = 'token_refreshed' | 'session_expired' | 'server_error';
type Listener = () => void;

class AuthEvents {
    private listeners: Record<string, Listener[]> = {};

    on(event: EventType, callback: Listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);

        // Fungsi untuk unsubscribe
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    emit(event: EventType) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback());
        }
    }
}

export const authEvents = new AuthEvents();