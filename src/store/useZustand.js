import { create } from 'zustand';
import { MondayStorageService } from './MondayStorageService';

import { saveCustomItemPosition as saveCustomItemPositionFn } from '../functions/saveCustomItemPosition';
import { updatePositionSetting as updatePositionSettingFn } from '../functions/updatePositionSetting';
import { clearCustomPositions as clearCustomPositionsFn } from '../functions/clearCustomPositions';
import { initializeItemPositions as initializeItemPositionsFn } from '../functions/initializeItemPositions';

// console.log('Zustand store created (should appear only once per reload)'); // Suppressed for focused debugging

// Monday.com storage keys
const HIDDEN_ITEMS_KEY = 'timeline-pro-hidden-items';

// Storage service instance (will be initialized when Monday SDK is available)
let storageService = null;

import loadHiddenItemsFromStorage from '../functions/loadHiddenItemsFromStorage';
// Helper functions for Monday.com storage persistence
// loadHiddenItemsFromStorage now imported from functions directory and called with (storageService, HIDDEN_ITEMS_KEY)

import saveHiddenItemsToStorage from '../functions/saveHiddenItemsToStorage';

export const useZustandStore = create((set, get) => ({
  settings: {},
  context: {},
  boardItems: [],
  itemIds: [],
  hiddenItemIds: [], // Will be loaded asynchronously from Monday storage
  hiddenItemsLoaded: false, // Track if hidden items have been loaded from Monday storage
  // Item position persistence
  customItemPositions: {}, // { itemId: { x, y } }
  currentPositionSetting: null, // Track position setting changes
  itemPositionsLoaded: false, // Loading state
  itemPositionsError: null, // Error handling
  timelineParams: {},
  timelineItems: [],
  setSettings: (settings) => {
    set({ settings });
  },
  setContext: (context) => {
    set({ context });
  },
  setBoardItems: (boardItems) => {
    set({ boardItems });
  },
  // Update a specific board item's date column value in the store
  updateBoardItemDate: (itemId, columnId, newDateValue) => {
    const { boardItems } = get();
    const updatedBoardItems = boardItems.map(item => {
      if (item.id === itemId) {
        // Update the column value for this item
        const updatedColumnValues = item.column_values.map(col => {
          if (col.id === columnId) {
            return {
              ...col,
              value: newDateValue, // Update the JSON value
              text: typeof newDateValue === 'string' ? JSON.parse(newDateValue).to || JSON.parse(newDateValue).date : col.text // Update display text
            };
          }
          return col;
        });
        
        return {
          ...item,
          column_values: updatedColumnValues
        };
      }
      return item;
    });
    
    set({ boardItems: updatedBoardItems });
  },
  setItemIds: (itemIds) => {
    set({ itemIds });
  },
  setHiddenItemIds: (hiddenItemIds) => {
    saveHiddenItemsToStorage(storageService, hiddenItemIds); // Persist to Monday storage (async)
    set({ hiddenItemIds });
  },
  // Initialize Monday storage service and load hidden items
  initializeMondayStorage: async (mondaySDK) => {
    try {
      storageService = new MondayStorageService(mondaySDK);
      const hiddenItemIds = await loadHiddenItemsFromStorage(storageService, HIDDEN_ITEMS_KEY);
      set({ hiddenItemIds, hiddenItemsLoaded: true });
    } catch (error) {
      // Even if loading fails, mark as loaded to prevent infinite loading
      set({ hiddenItemsLoaded: true });
    }
  },
  // Helper function to hide a single item
  hideItem: (itemId) => {
    const { hiddenItemIds } = get();
    if (!hiddenItemIds.includes(itemId)) {
      const newHiddenIds = [...hiddenItemIds, itemId];
      saveHiddenItemsToStorage(storageService, newHiddenIds); // Async save to Monday storage
      set({ hiddenItemIds: newHiddenIds });
    }
  },
  // Helper function to unhide a single item
  unhideItem: (itemId) => {
    const { hiddenItemIds } = get();
    const newHiddenIds = hiddenItemIds.filter(id => id !== itemId);
    saveHiddenItemsToStorage(newHiddenIds); // Async save to Monday storage
    set({ hiddenItemIds: newHiddenIds });
  },
  // Helper function to unhide all items
  unhideAllItems: () => {
    saveHiddenItemsToStorage(storageService, []); // Async save to Monday storage
    set({ hiddenItemIds: [] });
  },
  // Helper function to get count of hidden items
  getHiddenItemCount: () => {
    const { hiddenItemIds } = get();
    return hiddenItemIds.length;
  },
  setTimelineParams: (timelineParams) => {
    set({ timelineParams });
  },
  setTimelineItems: (timelineItems) => {
    if (timelineItems === null) {
      set({ timelineItems: null });
      return;
    }
    // Handle function updates (React setState pattern)
    if (typeof timelineItems === 'function') {
      set((state) => ({ 
        timelineItems: timelineItems(state.timelineItems) 
      }));
    } else {
      set({ timelineItems });
    }
  },

// Item position persistence methods
  saveCustomItemPosition: (itemId, position) => {
    return saveCustomItemPositionFn({ get, set, itemId, position, storageService });
  },

  updatePositionSetting: (newSetting) => {
    return updatePositionSettingFn({ get, set, newSetting, storageService });
  },

  clearCustomPositions: () => {
    return clearCustomPositionsFn({ get, set, storageService });
  },

  initializeItemPositions: async () => {
    return initializeItemPositionsFn({ get, set, storageService });
  },
}));
