import { ITEM_POSITIONS_KEY_PREFIX } from "../utils/configConstants";
import TimelineLogger from "../utils/logger";

/**
 * Load item positions from Monday.com storage
 * Handles both new Row/Lane Shift format and legacy Y-Delta format
 *
 * @param {string} boardId - The board ID
 * @param {Object} monday - Monday SDK instance
 * @returns {Object} Object with customItemY and legacy data (if any)
 */
export async function loadItemPositionsFromStorage(boardId, monday) {
  if (!monday || !monday.storage || !monday.storage.instance) {
    TimelineLogger.error(
      "[POS] Cannot load - Monday SDK storage not available",
    );
    return { customItemY: {}, legacy: null };
  }

  if (!boardId) {
    TimelineLogger.error("[POS] Cannot load - boardId is required");
    return { customItemY: {}, legacy: null };
  }

  try {
    const key = `${ITEM_POSITIONS_KEY_PREFIX}-${boardId}`;
    const res = await monday.storage.instance.getItem(key);

    if (!res?.data?.value) {
      TimelineLogger.debug("[POS] No saved positions found for board", {
        boardId,
      });
      return { customItemY: {}, legacy: null };
    }

    let parsed;
    try {
      parsed = JSON.parse(res.data.value);
    } catch (parseError) {
      TimelineLogger.error(
        "[POS] Failed to parse stored positions",
        parseError,
      );
      return { customItemY: {}, legacy: null };
    }

    // New schema with customItemY
    if (parsed.customItemY) {
      TimelineLogger.debug("[POS] Loaded positions using new schema", {
        boardId,
        itemCount: Object.keys(parsed.customItemY || {}).length,
      });
      return { customItemY: parsed.customItemY, legacy: null };
    }

    // Legacy schema (yDelta)
    if (parsed.customItemYDelta) {
      TimelineLogger.debug("[POS] Found legacy Y-deltas to migrate", {
        boardId,
        deltaCount: Object.keys(parsed.customItemYDelta || {}).length,
      });
      return {
        customItemY: {}, // Start with empty new format
        legacy: {
          customItemYDelta: parsed.customItemYDelta,
          positionSetting: parsed.positionSetting, // may exist
        },
      };
    }

    // Unknown schema
    TimelineLogger.warn("[POS] Unknown position data format", { parsed });
    return { customItemY: {}, legacy: null };
  } catch (error) {
    TimelineLogger.error(
      "[POS] Error loading positions from Monday storage",
      error,
    );
    return { customItemY: {}, legacy: null };
  }
}
