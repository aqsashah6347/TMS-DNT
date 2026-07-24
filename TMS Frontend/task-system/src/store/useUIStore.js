import { create } from "zustand";

// Global, app-wide UI signals that don't belong to any one feature store.
// confettiTrigger is a counter (not a boolean) so firing it twice in a
// row — e.g. completing two tasks back-to-back — still re-triggers the
// effect in ConfettiOverlay even though the "value" pattern would look
// unchanged with a boolean.
export const useUIStore = create((set) => ({
  confettiTrigger: 0,
  // The dueDate of whichever task was just marked done, captured alongside
  // confettiTrigger so TaskCompleteLottie can read it the moment the
  // trigger fires and render a "time left" readout under the tick
  // animation. null when the completed task had no due date.
  lastCompletedDueDate: null,
  isCompletedLogOpen: false,
  // completionBubble: null | { id, x, y, color }. Same "fresh object each
  // time" pattern as confettiTrigger being a counter — CompletionBubbleOverlay
  // compares the `id` (not the object reference) so firing it twice in a
  // row, e.g. completing two tasks back-to-back, still re-triggers the
  // flight even though the previous bubble already finished.
  completionBubble: null,

  fireConfetti: (dueDate = null) =>
    set((s) => ({
      confettiTrigger: s.confettiTrigger + 1,
      lastCompletedDueDate: dueDate,
    })),
  fireCompletionBubble: ({ x, y, color }) =>
    set({ completionBubble: { id: Date.now() + Math.random(), x, y, color } }),
  openCompletedLog: () => set({ isCompletedLogOpen: true }),
  closeCompletedLog: () => set({ isCompletedLogOpen: false }),
  toggleCompletedLog: () =>
    set((s) => ({ isCompletedLogOpen: !s.isCompletedLogOpen })),
}));
