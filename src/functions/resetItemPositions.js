import TimelineLogger from "../utils/logger";
import { saveItemPositionsToStorage } from "./saveItemPositionsToStorage";

/**
 * Resets item positions to defaults and clears custom positions.
 * @param {Object} params
 * @param {Function} set - Zustand store setter
 * @param {any} monday - Monday SDK instance
 * @param {string} boardId - Board ID for storage
 */
export default async function resetItemPositions({ set, monday, boardId }) {
  TimelineLogger.debug("[POS] Resetting item positions to defaults", {
    boardId,
  });

  if (!monday || !monday.storage || !monday.storage.instance) {
    TimelineLogger.error(
      "[POS] Cannot reset - Monday SDK storage not available",
    );
    return;
  }

  if (!boardId) {
    TimelineLogger.error("[POS] Cannot reset - boardId is required");
    return;
  }

  // Clear custom positions
  set({
    customItemY: {},
    itemPositionsLoaded: true,
    itemPositionsError: null,
  });

  // Persist the cleared state
  try {
    await saveItemPositionsToStorage(boardId, {}, monday);
    TimelineLogger.debug("[POS] Successfully reset positions to defaults", {
      boardId,
    });
  } catch (error) {
    TimelineLogger.error("[POS] Failed to persist reset positions", error);
  }
}
