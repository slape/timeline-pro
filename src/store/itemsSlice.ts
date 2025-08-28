// src/store/itemsSlice.ts
import type { ItemsSlice, SliceCreator } from "@/types/app";

export const createItemsSlice: SliceCreator<ItemsSlice> = (set, get) => ({
  itemsById: {},

  upsertItems: (items) =>
    set((s) => {
      for (const it of items) {
        const prev = s.itemsById[it.id];
        s.itemsById[it.id] = { ...it, yDelta: prev?.yDelta, laneId: prev?.laneId };
      }
    }),

  removeItems: (ids) =>
    set((s) => {
      for (const id of ids) delete s.itemsById[id];
    }),

  clearItems: () =>
    set((s) => {
      s.itemsById = {};
    }),

  updatePosition: (id, patch) =>
    set((s) => {
      const curr = s.itemsById[id];
      if (!curr) return;
      s.itemsById[id] = { ...curr, ...patch };
    }),
});
