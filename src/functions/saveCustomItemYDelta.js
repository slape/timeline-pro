import TimelineLogger from "../utils/logger";
import { saveItemPositionsToStorage } from "./saveItemPositionsToStorage";
import { LANE_HEIGHT } from "../utils/configConstants";

/**
 * Saves a custom Y-Delta for a timeline item
 * Converts legacy Y-Delta to new Row/Lane Shift format
 *
 * @param {string} itemId - ID of the item
 * @param {number} yDelta - Y-axis delta from default position
 * @param {Object} customItemYDelta - Current Y-Delta data from store
 * @param {string} boardId - Board ID for storage
 */
export default async function saveCustomItemYDelta({
  get,
  set,
  itemId,
  yDelta,
  storageService,
}) {
  // Get store state
  const { customItemYDelta = {}, customItemY = {}, context } = get();
  const boardId = context?.boardId;

  if (!boardId) {
    TimelineLogger.warn("Cannot save Y-Delta: no boardId available");
    return null;
  }

  // Log Zustand store state before update
  TimelineLogger.debug("[TEST] Zustand store before update", {
    customItemYDelta,
    customItemY,
  });

  // Update Y-Delta data (merge)
  const updatedYDeltas = {
    ...customItemYDelta,
    [itemId]: yDelta,
  };

  // Convert Y-Delta to Row/Lane Shift format for the new storage model
  // The rowShift is the Y-Delta divided by the lane height, rounded to nearest integer
  // The laneOffset is 0 by default
  const rowShift = Math.round(yDelta / LANE_HEIGHT);
  const laneOffset = 0;

  // Create or update the item position in the new format
  const updatedItemY = {
    ...customItemY,
    [itemId]: { rowShift, laneOffset },
  };

  TimelineLogger.debug("[Y-DELTA][PATCH] Converting to row/lane shift format", {
    itemId,
    yDelta,
    rowShift,
    laneOffset,
  });

  // Update both formats in the store
  set({
    customItemYDelta: updatedYDeltas,
    customItemY: updatedItemY,
  });

  // Log Zustand store state after update
  TimelineLogger.debug("[TEST] Zustand store after update", {
    customItemYDelta: updatedYDeltas,
    customItemY: updatedItemY,
  });

  TimelineLogger.debug(
    "[Y-DELTA][PATCH] Zustand store updated, calling saveItemPositionsToStorage with new format",
    {
      updatedItemY,
    },
  );

  // Save to Monday.com storage asynchronously using new row/lane shift format
  try {
    if (storageService && storageService.monday) {
      await saveItemPositionsToStorage(
        boardId,
        updatedItemY, // Use the new format for storage
        storageService.monday,
      );
      TimelineLogger.debug(
        "[TEST] Successfully persisted item positions in row/lane shift format",
      );
    } else {
      TimelineLogger.error(
        "[TEST] Cannot persist - storage service not available",
      );
    }
  } catch (error) {
    TimelineLogger.error("[TEST] Failed to persist item positions", error);
  }

  return { yDeltas: updatedYDeltas, itemY: updatedItemY };
}
