// src/store/settingsSlice.ts
import type { SettingsSlice, SliceCreator } from "@/types/app";
import { TimelineSettings } from "@/types/settings";

export const createSettingsSlice: SliceCreator<SettingsSlice> = (set, get) => ({
  settings: null,

  setSettings: (patch) =>
    set((s) => {
      if (!s.settings) {
        // initialize if null
        s.settings = { ...(patch as TimelineSettings) };
      } else {
        Object.assign(s.settings, patch);
      }
    }),

  replaceSettings: (value) =>
    set((s) => {
      s.settings = value;
    }),
});
