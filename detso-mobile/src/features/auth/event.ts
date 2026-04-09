type Listener = () => void;

class AuthEvents {
  private listeners: { [key: string]: Listener[] } = {};

  // Mendengarkan event
  on(event: string, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Fungsi untuk unsubscribe (membersihkan listener)
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  // Mengirimkan event
  emit(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback());
    }
  }
}

export const authEvents = new AuthEvents();