import { create } from 'zustand';
import TimelineLogger from '../utils/logger';

console.log('Zustand store created (should appear only once per reload)');

// Helper functions for localStorage persistence
const HIDDEN_ITEMS_KEY = 'timeline-pro-hidden-items';

const loadHiddenItemsFromStorage = () => {
  try {
    const stored = localStorage.getItem(HIDDEN_ITEMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    TimelineLogger.error('Failed to load hidden items from localStorage', error);
    return [];
  }
};

const saveHiddenItemsToStorage = (hiddenItemIds) => {
  try {
    localStorage.setItem(HIDDEN_ITEMS_KEY, JSON.stringify(hiddenItemIds));
  } catch (error) {
    TimelineLogger.error('Failed to save hidden items to localStorage', error);
  }
};

export const useZustandStore = create((set, get) => ({
  settings: {},
  context: {},
  boardItems: [],
  itemIds: [],
  hiddenItemIds: loadHiddenItemsFromStorage(), // Load from localStorage on init
  timelineParams: {},
  timelineItems: [],
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
    saveHiddenItemsToStorage(hiddenItemIds); // Persist to localStorage
    set({ hiddenItemIds });
  },
  // Helper function to hide a single item
  hideItem: (itemId) => {
    const { hiddenItemIds } = get();
    if (!hiddenItemIds.includes(itemId)) {
      const newHiddenIds = [...hiddenItemIds, itemId];
      TimelineLogger.userAction('timelineItemHidden', { itemId });
      saveHiddenItemsToStorage(newHiddenIds);
      set({ hiddenItemIds: newHiddenIds });
    }
  },
  // Helper function to unhide a single item
  unhideItem: (itemId) => {
    const { hiddenItemIds } = get();
    const newHiddenIds = hiddenItemIds.filter(id => id !== itemId);
    TimelineLogger.userAction('timelineItemUnhidden', { itemId });
    saveHiddenItemsToStorage(newHiddenIds);
    set({ hiddenItemIds: newHiddenIds });
  },
  // Helper function to unhide all items
  unhideAllItems: () => {
    TimelineLogger.userAction('allItemsUnhidden');
    saveHiddenItemsToStorage([]);
    set({ hiddenItemIds: [] });
  },
  // Helper function to get count of hidden items
  getHiddenItemCount: () => {
    const { hiddenItemIds } = get();
    return hiddenItemIds.length;
  },
  setTimelineParams: (timelineParams) => {
    TimelineLogger.debug('setTimelineParams called', timelineParams);
    set({ timelineParams });
  },
  setTimelineItems: (timelineItems) => {
    TimelineLogger.debug('setTimelineItems called', timelineItems);
    if (timelineItems === null) {
      set({ timelineItems: null });
      return;
    }
    
    // Handle function updates (React setState pattern)
    if (typeof timelineItems === 'function') {
      set((state) => ({ 
        timelineItems: timelineItems(state.timelineItems) 
      }));
      TimelineLogger.debug('timelineItems updated via function in store');
    } else {
      set({ timelineItems });
      TimelineLogger.debug('timelineItems set directly in store', timelineItems);
    }
  },
}));
