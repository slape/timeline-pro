import TimelineLogger from "../utils/logger";
import saveItemYDeltasToStorage from "./saveItemPositionsToStorage"; // This is correct if the function is in saveItemPositionsToStorage.js

/**
 * Saves a custom Y-Delta for a timeline item
 * @param {string} itemId - ID of the item
 * @param {number} yDelta - Y-axis delta from default position
 * @param {Object} customItemYDelta - Current Y-Delta data from store
 * @param {string} boardId - Board ID for storage
 * @param {string} currentPositionSetting - Current position setting
 */
export default async function saveCustomItemYDelta({
  get,
  set,
  itemId,
  yDelta,
  storageService,
}) {
  const { currentPositionSetting } = get();
  TimelineLogger.debug("[Y-DELTA][STORE] Saving yDelta to store", {
    itemId,
    yDelta,
  });
  const { customItemYDelta = {}, context } = get();
  const boardId = context?.boardId;
  if (!boardId) {
    TimelineLogger.warn("Cannot save Y-Delta: no boardId available");
    return null;
  }

  // Log Zustand store state before update
  TimelineLogger.debug("[TEST] Zustand store before update", {
    customItemYDelta,
  });

  // Update Y-Delta data (merge)
  const updatedYDeltas = {
    ...customItemYDelta,
    [itemId]: yDelta,
  };

  TimelineLogger.debug(
    "[Y-DELTA][PATCH] About to update Zustand store customItemYDelta",
    {
      itemId,
      yDelta,
      updatedYDeltas,
    },
  );
  set({ customItemYDelta: updatedYDeltas });

  // Log Zustand store state after update
  TimelineLogger.debug("[TEST] Zustand store after update", {
    customItemYDelta: updatedYDeltas,
  });

  TimelineLogger.debug(
    "[Y-DELTA][PATCH] Zustand store updated, calling saveItemYDeltasToStorage",
    {
      updatedYDeltas,
    },
  );

  // Log parameters passed to saveItemYDeltasToStorage
  TimelineLogger.debug("[TEST] saveItemYDeltasToStorage called with", {
    storageService,
    boardId,
    updatedYDeltas,
    currentPositionSetting,
  });

  // Save to Monday.com storage asynchronously
  try {
    await saveItemYDeltasToStorage(
      storageService,
      boardId,
      updatedYDeltas,
      currentPositionSetting,
    );
    TimelineLogger.debug("[TEST] Successfully persisted Y-deltas");
  } catch (error) {
    TimelineLogger.error("[TEST] Failed to persist Y-deltas", error);
  }

  return updatedYDeltas;
}
