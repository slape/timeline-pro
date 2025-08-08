import { create } from 'zustand';
import TimelineLogger from '../utils/logger';

console.log('Zustand store created (should appear only once per reload)');

export const useZustandStore = create((set, get) => ({
  settings: null,
  context: null,
  boardItems: null,
  itemIds: null,
  hiddenItemIds: new Set(),
  timelineParams: null,
  timelineItems: null,
  setSettings: (settings) => {
    TimelineLogger.debug('setSettings called', settings);
    set({ settings });
  },
  setContext: (context) => {
    TimelineLogger.debug('setContext called', context);
    set({ context });
  },
  setBoardItems: (boardItems) => {
    TimelineLogger.debug('setBoardItems called', boardItems);
    set({ boardItems });
  },
  setItemIds: (itemIds) => {
    TimelineLogger.debug('setItemIds called', itemIds);
    set({ itemIds });
  },
  setHiddenItemIds: (hiddenItemIds) => {
    TimelineLogger.debug('setHiddenItemIds called', hiddenItemIds);
    set({ hiddenItemIds });
  },
  setTimelineParams: (timelineParams) => {
    TimelineLogger.debug('setTimelineParams called', timelineParams);
    if (timelineParams === null) {
      set({ timelineParams: null });
      return;
    }
    // Defensive: always store Date objects
    const safeParams = {
      ...timelineParams,
      startDate: timelineParams.startDate instanceof Date ? timelineParams.startDate : new Date(timelineParams.startDate),
      endDate: timelineParams.endDate instanceof Date ? timelineParams.endDate : new Date(timelineParams.endDate),
    };
    set({ timelineParams: safeParams });
    TimelineLogger.debug('timelineParams set in store', safeParams);
  },
  setTimelineItems: (timelineItems) => {
    TimelineLogger.debug('setTimelineItems called', timelineItems);
    if (timelineItems === null) {
      set({ timelineItems: null });
      return;
    }
    set({ timelineItems });
    TimelineLogger.debug('timelineItems set in store', timelineItems);
  },
}));
