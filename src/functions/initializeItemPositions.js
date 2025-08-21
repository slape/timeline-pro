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
  // Log to verify if initializeItemPositions is called
  TimelineLogger.debug("[TEST] initializeItemPositions function invoked");

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

    // Log the Zustand store state before attempting to load positions
    TimelineLogger.debug("[TEST] Zustand store before loading positions", {
      customItemYDelta: get().customItemYDelta,
    });

    const positionData = await loadItemPositionsFromStorage(
      storageService,
      boardId,
    );

    // Log the data fetched from Monday storage
    TimelineLogger.debug("[TEST] Data fetched from Monday storage", {
      positionData,
    });

    TimelineLogger.debug("✅ Setting customItemYDelta in store", {
      boardId,
      customItemYDelta: positionData.customItemYDelta || {},
    });
    set({
      customItemYDelta: positionData.customItemYDelta || {},
    });

    // Log the Zustand store state after updating with loaded positions
    TimelineLogger.debug("[TEST] Zustand store after loading positions", {
      customItemYDelta: get().customItemYDelta,
    });
    TimelineLogger.debug(
      "[Y-DELTA] Zustand store customItemYDelta after reload",
      {
        customItemYDelta: positionData.customItemYDelta || {},
      },
    );
  } catch (error) {
    TimelineLogger.error("❌ Failed to initialize item positions", error);
    set({
      itemPositionsLoaded: true,
      itemPositionsError: error.message || "Failed to load positions",
    });
  }
}
