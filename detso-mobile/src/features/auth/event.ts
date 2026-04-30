/**
 * @deprecated — Migrated to `src/lib/event-bus.ts`.
 * Use `eventBus` + `EVENTS.AUTH.*` instead.
 *
 * This file is kept temporarily so any stale imports produce a clear error.
 * Safe to delete once all references are confirmed removed.
 */
export { eventBus as authEvents } from '@/src/lib/event-bus';
