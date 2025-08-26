import { ITEM_POSITIONS_KEY_PREFIX } from "../utils/configConstants";
import TimelineLogger from "../utils/logger";

/**
 * Save item positions to Monday.com storage using the Row/Lane Shift model
 *
 * @param {string} boardId - The board ID
 * @param {Object} customItemY - Object mapping itemId to { rowShift, laneOffset }
 * @param {Object} monday - Monday SDK instance
 * @returns {Object} Result object with success flag and optional error
 */
export async function saveItemPositionsToStorage(boardId, customItemY, monday) {
  if (!monday || !monday.storage || !monday.storage.instance) {
    TimelineLogger.error(
      "[POS] Cannot save - Monday SDK storage not available",
    );
    return { success: false, error: "Monday SDK storage not available" };
  }

  if (!boardId) {
    TimelineLogger.error("[POS] Cannot save - boardId is required");
    return { success: false, error: "boardId is required" };
  }

  try {
    const key = `${ITEM_POSITIONS_KEY_PREFIX}-${boardId}`;
    const payload = { boardId, customItemY }; // NEW schema
    const result = await monday.storage.instance.setItem(
      key,
      JSON.stringify(payload),
    );

    if (result?.data?.success) {
      TimelineLogger.debug(
        "[POS] Successfully saved positions to Monday storage",
        {
          boardId,
          itemCount: Object.keys(customItemY || {}).length,
        },
      );
      return { success: true };
    } else {
      TimelineLogger.error(
        "[POS] Failed to save positions to Monday storage",
        result?.data?.error,
      );
      return { success: false, error: result?.data?.error || "Unknown error" };
    }
  } catch (error) {
    TimelineLogger.error(
      "[POS] Error saving positions to Monday storage",
      error,
    );
    return { success: false, error: String(error?.message || error) };
  }
}
