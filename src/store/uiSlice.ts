// src/store/uiSlice.ts
import type { SliceCreator, UiSlice } from "@/types/app";

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  error: null,
  hiddenIds: [],
  setError: (err) => set((s) => { s.error = err; }),  // <-- assign AppError | null
  setHiddenIds: (ids) => set((s) => { s.hiddenIds = Array.from(new Set(ids)); }),
});
