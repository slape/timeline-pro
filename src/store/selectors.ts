// src/store/selectors.ts
import type { StoreState } from "../types/app";
import type { TimelineItem } from "../types/Item";

// Primitive pieces
export const selectItemsById = (s: StoreState) => s.itemsById;
export const selectItemsArray = (s: StoreState) => Object.values(s.itemsById);
export const selectHiddenIds = (s: StoreState) => s.hiddenIds;

// Derived helpers
export const selectHiddenSet = (s: StoreState) => new Set(selectHiddenIds(s));

export const selectVisibleItems = (s: StoreState): TimelineItem[] => {
  const hidden = selectHiddenSet(s);
  return selectItemsArray(s).filter((it) => !hidden.has(it.id));
};

// Curried byId selector for components
export const byId =
  (id: string) =>
  (s: StoreState): TimelineItem | undefined =>
    s.itemsById[id];
