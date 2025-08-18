import TimelineLogger from "../utils/logger";
import { ITEM_POSITIONS_KEY_PREFIX } from "../utils/configConstants";

const saveItemYDeltasToStorage = async (
  storageService,
  boardId,
  itemYDelta = {},
) => {
  TimelineLogger.debug("[Y-DELTA] saveItemYDeltasToStorage called", {
    boardId,
    itemYDelta,
  });
  if (!storageService || !boardId) {
    TimelineLogger.debug(
      "Storage service not initialized or no boardId, skipping save",
    );
    return;
  }
  try {
    const storageKey = `${ITEM_POSITIONS_KEY_PREFIX}-${boardId}`;
    const dataToSave = {
      boardId,
      customItemYDelta: itemYDelta || {},
    };
    console.log("[Y-DELTA][STORAGE] Saving Y-deltas", { boardId, itemYDelta });
    const response = await storageService.setInstanceItem(
      storageKey,
      dataToSave,
    );
    if (response?.data?.success) {
      TimelineLogger.debug(
        "Successfully saved item Y-deltas to Monday storage",
        {
          boardId,
          yDeltaCount: Object.keys(dataToSave.customItemYDelta || {}).length,
        },
      );
    } else {
      TimelineLogger.error(
        "Failed to save item Y-deltas to Monday storage",
        response?.data?.error,
      );
    }
  } catch (error) {
    TimelineLogger.error(
      "Failed to save item Y-deltas to Monday storage",
      error,
    );
  }
};

export default saveItemYDeltasToStorage;
