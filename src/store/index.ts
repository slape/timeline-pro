// src/store/index.ts
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import type { StoreState } from "@/types/store";
import { createContextSlice } from "./contextSlice";
import { createSettingsSlice } from "./settingsSlice";
import { createItemsSlice } from "./itemsSlice";
import { createUiSlice } from "./uiSlice";

export const useStore = create<StoreState>()(
  subscribeWithSelector(
    immer((set, get, api) => {
      const initial = {
        ...createContextSlice(set, get, api),
        ...createSettingsSlice(set, get, api),
        ...createItemsSlice(set, get, api),
        ...createUiSlice(set, get, api),
      };

      return {
        ...initial,
        reset: () =>
          set((s: any) => {
            // reset only data-bearing fields; keep actions
            s.context = null;
            s.settings = null;
            s.itemsById = {};
            s.error = null;
            s.hiddenIds = [];
          }),
      };
    })
  )
);

// Convenience re-exports
export const getState = () => useStore.getState();
export const setState = useStore.setState;
