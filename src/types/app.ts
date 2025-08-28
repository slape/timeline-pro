// src/types/app.ts
import { TimelineItem } from "./Item";
import { TimelineSettings } from "./settings";
import { MondayContextMinimal } from "./monday_storage";
// src/store/types.ts
import type { StateCreator } from "zustand";

// StateCreator with our two middlewares: immer + subscribeWithSelector
export type SliceCreator<T> = StateCreator<
  StoreState,
  [["zustand/immer", never], ["zustand/subscribeWithSelector", never]],
  [], // no additional middleware APIs
  T
>;

// src/types/app.ts
export type AppError =
  | { type: "viewOnly";    message: string }
  | { type: "invalidDate"; message: string }
  | { type: "tooManyItems";message: string }
  | { type: "noItems";     message: string }
  | { type: "loadFailed";  message: string };

export type PositionPatch = { laneId?: string; yDelta?: number };

/** Slices (compose into StoreState) */
export type ContextSlice = {
  context: MondayContextMinimal | null;
  setContext: (ctx: MondayContextMinimal) => void;
};

export type SettingsSlice = {
  settings: TimelineSettings | null;
  setSettings: (s: Partial<TimelineSettings>) => void;
};

export type ItemsSlice = {
  itemsById: Record<string, TimelineItem>;
  upsertItems: (items: TimelineItem[]) => void;
  updatePosition: (id: string, patch: PositionPatch) => void;
};

export type UiSlice = {
  error: AppError | null; 
  setError: (err: AppError | null) => void;
  hiddenIds: string[];
  setHiddenIds: (ids: string[]) => void;
};

/** The app-wide Zustand store state */
export type StoreState = ContextSlice & SettingsSlice & ItemsSlice & UiSlice;
