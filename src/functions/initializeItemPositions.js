import TimelineLogger from "../utils/logger";
import loadItemPositionsFromStorage from "./loadItemPositionsFromStorage";

/**
 * Initializes item positions from Monday.com storage and updates the store.
 * @param {Object} params
 * @param {Function} get - Zustand store getter
 * @param {Function} set - Zustand store setter
 * @param {any} storageService - Monday storage service
 */
export async function initializeItemPositions({ get, set, storageService }) {
  TimelineLogger.debug("[Y-DELTA] initializeItemPositions called", {
    hasStorageService: !!storageService,
  });
  const { context } = get();
  const boardId = context?.boardId;

  if (!boardId) {
    TimelineLogger.warn(
      "Cannot initialize item positions: no boardId available",
    );
    set({
      itemPositionsLoaded: true,
      itemPositionsError: "No board ID available",
    });
    return;
  }

  try {
    TimelineLogger.debug("🔄 Loading item positions from Monday storage...", {
      boardId,
    });
    if (!storageService) {
      TimelineLogger.warn("Storage service not initialized for item positions");
      set({
        itemPositionsLoaded: true,
        itemPositionsError: "Storage service not available",
      });
      return;
    }
    const positionData = await loadItemPositionsFromStorage(
      storageService,
      boardId,
    );
    TimelineLogger.debug("✅ Setting customItemYDelta in store", {
      boardId,
      customItemYDelta: positionData.customItemYDelta || {},
    });
    set({
      customItemYDelta: positionData.customItemYDelta || {},
    });
    TimelineLogger.debug("[Y-DELTA] Zustand store customItemYDelta after reload", {
      customItemYDelta: positionData.customItemYDelta || {},
    });
  } catch (error) {
    TimelineLogger.error("❌ Failed to initialize item positions", error);
    set({
      itemPositionsLoaded: true,
      itemPositionsError: error.message || "Failed to load positions",
    });
  }
}
