// src/store/contextSlice.ts
import type { ContextSlice, SliceCreator } from "../types/app";

export const createContextSlice: SliceCreator<ContextSlice> = (set, _get, _api) => ({
  context: null,
  setContext: (ctx) => {
    set((s) => {
      s.context = ctx;
    });
  },
});
