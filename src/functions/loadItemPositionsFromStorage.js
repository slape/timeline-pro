import TimelineLogger from "../utils/logger";
import { ITEM_POSITIONS_KEY_PREFIX } from "../utils/configConstants";

const loadItemPositionsFromStorage = async (storageService, boardId) => {
  if (!storageService || !boardId) {
    TimelineLogger.debug(
      "Storage service not initialized or no boardId, returning empty object",
    );
    return {};
  }
  try {
    const storageKey = `${ITEM_POSITIONS_KEY_PREFIX}-${boardId}`;
    const response = await storageService.getInstanceItem(storageKey);
    if (response?.data?.success && response.data.value) {
      const positionData = response.data.value;
      if (
        positionData &&
        typeof positionData === "object" &&
        positionData.customItemYDelta
      ) {
        TimelineLogger.debug("Loaded item Y-deltas from Monday storage", {
          boardId,
          yDeltaCount: Object.keys(positionData.customItemYDelta || {}).length,
        });
        return {
          boardId,
          customItemYDelta: positionData.customItemYDelta || {},
        };
      }
    }
    return { boardId, customItemYDelta: {} };
  } catch (error) {
    TimelineLogger.error(
      "Failed to load item positions from Monday storage",
      error,
    );
    return { boardId, customItemYDelta: {} };
  }
};

export default loadItemPositionsFromStorage;
