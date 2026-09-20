export const TOAST_EVENT = 'firstaidflow:toast';

// Tiny event-bus toast so non-React modules (sync manager) can notify the UI.
export function toast(message, { duration = 3000 } = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, message, duration },
    }),
  );
}
