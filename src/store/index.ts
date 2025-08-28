// src/store/index.ts
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import type { StoreState } from "../types/app";
import { createContextSlice } from "./contextSlice";
import { createSettingsSlice } from "./settingsSlice";
import { createItemsSlice } from "./itemsSlice";
import { createUiSlice } from "./uiSlice";

export const useStore = create<StoreState>()(
  subscribeWithSelector(
    immer((set, get, api) => ({
      ...createContextSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
      ...createItemsSlice(set, get, api),
      ...createUiSlice(set, get, api),
    }))
  )
);

// Convenience re-exports
export const getState = () => useStore.getState();
export const setState = useStore.setState;
