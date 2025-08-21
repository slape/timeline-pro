import { create } from "zustand";
import TimelineLogger from "../utils/logger";
import { MondayStorageService } from "./MondayStorageService";
import { updatePositionSetting as updatePositionSettingFn } from "../functions/updatePositionSetting";
import saveCustomItemYDeltaFn from "../functions/saveCustomItemYDelta";
import { HIDDEN_ITEMS_KEY } from "../utils/configConstants";
import { initializeItemPositions } from "../functions/initializeItemPositions";
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
  // Tracks the current timeline position setting (e.g., 'above', 'below', 'alternate')
  currentPositionSetting: null,
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
      TimelineLogger.debug("Loaded hidden items from storage", {
        count: hiddenItemIds.length,
        items: hiddenItemIds,
      });
      set({ hiddenItemIds, hiddenItemsLoaded: true, appLoading: false }); // Set appLoading to false after initialization
    } catch (error) {
      TimelineLogger.error("Failed to initialize Monday storage", error);
      // Even if loading fails, mark as loaded to prevent infinite loading
      set({ hiddenItemsLoaded: true, appLoading: false });
    }
  },
  // Optimistic update: update local hiddenItemIds state immediately, then sync to Monday.com storage in the background.
  // If storage fails, roll back the change and log an error.
  updateHiddenItemsInStorage: async (updateFn, actionName) => {
    if (!storageService) {
      TimelineLogger.warn(
        "Storage service not available for action:",
        actionName,
      );
      return;
    }
    TimelineLogger.debug(
      `[Zustand] Action: ${actionName} - Starting optimistic update.`,
    );
    // Use the latest local store state as the source of truth
    const localHiddenIds = get().hiddenItemIds;
    const optimisticHiddenIds = updateFn(
      Array.isArray(localHiddenIds) ? localHiddenIds : [],
    );
    // Optimistically update local state immediately
    set({ hiddenItemIds: optimisticHiddenIds });
    try {
      const newHiddenIds = await storageService.safeUpdate(
        HIDDEN_ITEMS_KEY,
        (currentValue) => {
          // Use optimistic state as base, fallback to storage value if not available
          const currentHiddenIds = Array.isArray(optimisticHiddenIds)
            ? optimisticHiddenIds
            : Array.isArray(currentValue)
              ? currentValue
              : [];
          TimelineLogger.debug(
            `[Y-DELTA][Zustand] safeUpdate: Current hidden IDs (OPTIMISTIC)`,
            { count: currentHiddenIds.length, ids: currentHiddenIds },
          );
          const updatedIds = updateFn(currentHiddenIds);
          TimelineLogger.debug(
            `[Y-DELTA][Zustand] safeUpdate: New hidden IDs to be saved`,
            { count: updatedIds.length, ids: updatedIds },
          );
          return updatedIds;
        },
      );
      if (newHiddenIds !== null) {
        TimelineLogger.debug(
          `[Y-DELTA][Zustand] safeUpdate successful. New state:`,
          { count: newHiddenIds.length, ids: newHiddenIds },
        );
        // Local state already set optimistically
      } else {
        // Rollback: revert to previous state if storage fails
        TimelineLogger.error(
          `[Zustand] Failed to safely update hidden items in storage for action: ${actionName}. Rolling back.`,
        );
        set({ hiddenItemIds: localHiddenIds });
      }
    } catch (error) {
      TimelineLogger.error(
        `[Zustand] Optimistic update failed for action: ${actionName}. Rolling back.`,
        { error },
      );
      set({ hiddenItemIds: localHiddenIds });
    }
  },

  // Helper function to hide a single item
  hideItem: (itemId) => {
    const prevHidden = get().hiddenItemIds;
    TimelineLogger.debug(`[Y-DELTA][Zustand] Action: hideItem`, {
      itemId,
      prevHidden,
    });
    get().updateHiddenItemsInStorage((currentHiddenIds) => {
      TimelineLogger.debug(
        `[Y-DELTA][Zustand] hideItem: currentHiddenIds before update`,
        { currentHiddenIds },
      );
      let updated;
      if (!currentHiddenIds.includes(itemId)) {
        updated = [...currentHiddenIds, itemId];
      } else {
        updated = currentHiddenIds;
      }
      TimelineLogger.debug(
        `[Y-DELTA][Zustand] hideItem: updatedHiddenIds after update`,
        { updated },
      );
      return updated;
    }, "hideItem");
  },
  // Helper function to unhide a single item
  unhideItem: (itemId) => {
    TimelineLogger.debug(`[Zustand] Action: unhideItem`, { itemId });
    get().updateHiddenItemsInStorage((currentHiddenIds) => {
      return currentHiddenIds.filter((id) => id !== itemId);
    }, "unhideItem");
  },

  // Helper function to unhide all items
  unhideAllItems: () => {
    TimelineLogger.debug(`[Zustand] Action: unhideAllItems`);
    get().updateHiddenItemsInStorage(() => [], "unhideAllItems");
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
    return saveCustomItemYDeltaFn({ get, set, itemId, yDelta, storageService });
  },

  updatePositionSetting: (newSetting) => {
    return updatePositionSettingFn({ get, set, newSetting, storageService });
  },

  initializeItemPositions: () => {
    return initializeItemPositions({ get, set, storageService });
  },

  // Updates the current position setting in the store
  setCurrentPositionSetting: (newSetting) => {
    set({ currentPositionSetting: newSetting });
  },
}));
