import { create } from "zustand";
import TimelineLogger from "../utils/logger";
import { MondayStorageService } from "./MondayStorageService";

import { updatePositionSetting as updatePositionSettingFn } from "../functions/updatePositionSetting";
import { clearCustomPositions as clearCustomPositionsFn } from "../functions/clearCustomPositions";
import { initializeItemPositions as initializeItemPositionsFn } from "../functions/initializeItemPositions";

// console.log('Zustand store created (should appear only once per reload)'); // Suppressed for focused debugging

import { HIDDEN_ITEMS_KEY } from "../utils/configConstants";

// Storage service instance (will be initialized when Monday SDK is available)
let storageService = null;

import loadHiddenItemsFromStorage from "../functions/loadHiddenItemsFromStorage";
// Helper functions for Monday.com storage persistence
// loadHiddenItemsFromStorage now imported from functions directory and called with (storageService, HIDDEN_ITEMS_KEY)


export const useZustandStore = create((set, get) => ({
  settings: {},
  context: {},
  boardItems: [],
  itemIds: [],
  hiddenItemIds: [], // Will be loaded asynchronously from Monday storage
  hiddenItemsLoaded: false, // Track if hidden items have been loaded from Monday storage
  appLoading: true, // New state to manage initial app load
  // Y-delta persistence only
  customItemYDelta: {}, // { itemId: number } - Y-axis delta persistence
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
    const updatedBoardItems = boardItems.map((item) => {
      if (item.id === itemId) {
        // Update the column value for this item
        const updatedColumnValues = item.column_values.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              value: newDateValue, // Update the JSON value
              text:
                typeof newDateValue === "string"
                  ? JSON.parse(newDateValue).to || JSON.parse(newDateValue).date
                  : col.text, // Update display text
            };
          }
          return col;
        });

        return {
          ...item,
          column_values: updatedColumnValues,
        };
      }
      return item;
    });

    set({ boardItems: updatedBoardItems });
  },
  setItemIds: (itemIds) => {
    set({ itemIds });
  },
  // Initialize Monday storage service and load hidden items
  initializeMondayStorage: async (mondaySDK) => {
    try {
      storageService = new MondayStorageService(mondaySDK);
      TimelineLogger.debug("Storage service initialized.");
      const hiddenItemIds = await loadHiddenItemsFromStorage(
        storageService,
        HIDDEN_ITEMS_KEY,
      );
      TimelineLogger.debug("Loaded hidden items from storage", { count: hiddenItemIds.length, items: hiddenItemIds });
      set({ hiddenItemIds, hiddenItemsLoaded: true, appLoading: false }); // Set appLoading to false after initialization
    } catch (error) { 
      TimelineLogger.error("Failed to initialize Monday storage", error);
      // Even if loading fails, mark as loaded to prevent infinite loading
      set({ hiddenItemsLoaded: true, appLoading: false });
    }
  },
  // Safely update hidden items in storage to prevent race conditions
  updateHiddenItemsInStorage: async (updateFn, actionName) => {
    if (!storageService) {
        TimelineLogger.warn("Storage service not available for action:", actionName);
        return;
    }
    TimelineLogger.debug(`[Zustand] Action: ${actionName} - Starting safe update.`);
    const newHiddenIds = await storageService.safeUpdate(
      HIDDEN_ITEMS_KEY,
      (currentValue) => {
        const currentHiddenIds = Array.isArray(currentValue) ? currentValue : [];
        TimelineLogger.debug(`[Zustand] safeUpdate: Current hidden IDs`, { count: currentHiddenIds.length, ids: currentHiddenIds });
        const updatedIds = updateFn(currentHiddenIds);
        TimelineLogger.debug(`[Zustand] safeUpdate: New hidden IDs to be saved`, { count: updatedIds.length, ids: updatedIds });
        return updatedIds;
      },
    );
    if (newHiddenIds !== null) {
      TimelineLogger.debug(`[Zustand] safeUpdate successful. New state:`, { count: newHiddenIds.length, ids: newHiddenIds });
      set({ hiddenItemIds: newHiddenIds });
    } else {
      TimelineLogger.error(`[Zustand] Failed to safely update hidden items in storage for action: ${actionName}.`);
    }
  },

  // Helper function to hide a single item
  hideItem: (itemId) => {
    TimelineLogger.debug(`[Zustand] Action: hideItem`, { itemId });
    get().updateHiddenItemsInStorage((currentHiddenIds) => {
      if (!currentHiddenIds.includes(itemId)) {
        return [...currentHiddenIds, itemId];
      }
      return currentHiddenIds;
    }, 'hideItem');
  },

  // Helper function to unhide a single item
  unhideItem: (itemId) => {
    TimelineLogger.debug(`[Zustand] Action: unhideItem`, { itemId });
    get().updateHiddenItemsInStorage((currentHiddenIds) => {
      return currentHiddenIds.filter((id) => id !== itemId);
    }, 'unhideItem');
  },

  // Helper function to unhide all items
  unhideAllItems: () => {
    TimelineLogger.debug(`[Zustand] Action: unhideAllItems`);
    get().updateHiddenItemsInStorage(() => [], 'unhideAllItems');
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
    if (typeof timelineItems === "function") {
      set((state) => ({
        timelineItems: timelineItems(state.timelineItems),
      }));
    } else {
      set({ timelineItems });
    }
  },

  // Y-delta persistence methods
  saveCustomItemYDelta: (itemId, yDelta) => {
    const { saveCustomItemYDelta } = require("../functions/saveCustomItemYDelta");
    return saveCustomItemYDelta({ get, set, itemId, yDelta, storageService });
  },

  updatePositionSetting: (newSetting) => {
    return updatePositionSettingFn({ get, set, newSetting, storageService });
  },

  initializeItemPositions: () => {
    const { initializeItemPositions } = require("../functions/initializeItemPositions");
    return initializeItemPositions({ get, set, storageService });
  },

}));
