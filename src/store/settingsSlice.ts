// src/store/settingsSlice.ts
import type { SettingsSlice, SliceCreator } from "../types/app";
import { omitUndefined } from "../lib/objects";

export const createSettingsSlice: SliceCreator<SettingsSlice> = (set) => ({
  settings: null,
  setSettings: (patch) => {
    set((s) => {
      const safePatch = omitUndefined(patch);
      s.settings = s.settings ? { ...s.settings, ...safePatch } : (safePatch as any);
      // optional: if you want a guaranteed full object, merge a DEFAULTS here instead
    });
  },
});
