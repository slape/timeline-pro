import TimelineLogger from "../utils/logger";
import { ITEM_POSITIONS_KEY_PREFIX } from "../utils/configConstants";

const saveItemYDeltasToStorage = async (
  storageService,
  boardId,
  customItemYDelta = {},
  currentPositionSetting = null,
) => {
  TimelineLogger.debug("[Y-DELTA] saveItemYDeltasToStorage called", {
    boardId,
    customItemYDelta,
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
      customItemYDelta: customItemYDelta || {},
      positionSetting: currentPositionSetting,
    };
    console.log("[Y-DELTA][STORAGE] Saving Y-deltas", {
      boardId,
      customItemYDelta,
    });
    // Serialize data before saving
    const serializedDataToSave = JSON.stringify(dataToSave);

    const response = await storageService.setInstanceItem(
      storageKey,
      serializedDataToSave,
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
