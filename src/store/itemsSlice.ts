// src/store/itemsSlice.ts
import type { ItemsSlice, PositionPatch, SliceCreator } from "../types/app";
import type { TimelineItem } from "../types/Item";

export const createItemsSlice: SliceCreator<ItemsSlice> = (set, get, _api) => ({
  itemsById: {},

  upsertItems: (items: TimelineItem[]) => {
    set((s) => {
      for (const it of items) {
        const prev = s.itemsById[it.id];
        s.itemsById[it.id] = prev ? { ...prev, ...it } : it;
      }
    });
  },

  updatePosition: (id: string, patch: PositionPatch) => {
    set((s) => {
      const it = s.itemsById[id];
      if (!it) return;
      if (patch.laneId !== undefined) it.laneId = patch.laneId;
      if (patch.yDelta !== undefined) it.yDelta = patch.yDelta;
    });
  },
});
