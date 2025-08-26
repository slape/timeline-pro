import { useZustandStore } from "../store/useZustand";
import { loadItemPositionsFromStorage } from "./loadItemPositionsFromStorage";
import TimelineLogger from "../utils/logger";

/**
 * Initialize item positions from Monday.com storage
 * Loads positions and handles legacy data migration if needed
 *
 * @param {string} boardId - The board ID
 */
export async function initializeItemPositions(boardId) {
  const { setCustomItemYBulk, setItemPositionsLoaded, setItemPositionsError } =
    useZustandStore.getState();

  if (!boardId) {
    TimelineLogger.error(
      "[POS] Cannot initialize positions - boardId is required",
    );
    setItemPositionsError("Board ID is required");
    return;
  }

  try {
    TimelineLogger.debug("[POS] Initializing item positions", { boardId });

    // Get the monday SDK instance from the store
    const monday = useZustandStore.getState().monday;
    if (!monday) {
      TimelineLogger.error(
        "[POS] Cannot initialize positions - Monday SDK not available",
      );
      setItemPositionsError("Monday SDK not available");
      return;
    }

    // Load positions from storage
    const { customItemY, legacy } = await loadItemPositionsFromStorage(
      boardId,
      monday,
    );

    // Update the store with loaded positions
    setCustomItemYBulk(customItemY);

    // Stash legacy for a one-time migration when items + setting are known
    if (legacy) {
      window.__LEGACY_YDELTA__ = legacy;
      TimelineLogger.info(
        "[POS] Legacy deltas found; will migrate after items are ready",
        {
          boardId,
          deltaCount: Object.keys(legacy.customItemYDelta || {}).length,
        },
      );
    }

    setItemPositionsLoaded(true);
    TimelineLogger.debug("[POS] Item positions initialized successfully", {
      boardId,
      itemCount: Object.keys(customItemY || {}).length,
      hasMigration: !!legacy,
    });
  } catch (e) {
    TimelineLogger.error("[POS] Failed to initialize item positions", e);
    setItemPositionsError(String(e?.message || e));
  }
}
