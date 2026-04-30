import { useEffect, useRef } from 'react';
import { eventBus, EventMap } from '@/src/lib/event-bus';

/**
 * Subscribe to an event bus event with automatic cleanup on unmount.
 *
 * @param event  - Event key from EVENTS constant
 * @param callback - Handler invoked when the event fires
 *
 * @example
 * ```tsx
 * useEventBus(EVENTS.CUSTOMER.CREATED, (data) => {
 *   refetch(); // refresh list when a customer is created elsewhere
 * });
 * ```
 */
export function useEventBus<K extends keyof EventMap>(
  event: K,
  callback: (data: EventMap[K]) => void,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (data: EventMap[K]) => callbackRef.current(data);
    const unsubscribe = eventBus.subscribe(event, handler);
    return unsubscribe;
  }, [event]);
}

/**
 * Subscribe once — handler fires at most one time, then auto-unsubscribes.
 */
export function useEventBusOnce<K extends keyof EventMap>(
  event: K,
  callback: (data: EventMap[K]) => void,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (data: EventMap[K]) => callbackRef.current(data);
    const unsubscribe = eventBus.once(event, handler);
    return unsubscribe;
  }, [event]);
}
