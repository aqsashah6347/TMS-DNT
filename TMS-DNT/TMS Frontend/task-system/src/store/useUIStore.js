import { create } from "zustand";

// Global, app-wide UI signals that don't belong to any one feature store.
// confettiTrigger is a counter (not a boolean) so firing it twice in a
// row — e.g. completing two tasks back-to-back — still re-triggers the
// effect in ConfettiOverlay even though the "value" pattern would look
// unchanged with a boolean.
export const useUIStore = create((set) => ({
  confettiTrigger: 0,
  isCompletedLogOpen: false,

  fireConfetti: () => set((s) => ({ confettiTrigger: s.confettiTrigger + 1 })),
  openCompletedLog: () => set({ isCompletedLogOpen: true }),
  closeCompletedLog: () => set({ isCompletedLogOpen: false }),
  toggleCompletedLog: () =>
    set((s) => ({ isCompletedLogOpen: !s.isCompletedLogOpen })),
}));
