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

    // Log the storage key being used
    TimelineLogger.debug("[TEST] Using storage key", { storageKey });

    const response = await storageService.getInstanceItem(storageKey);

    // Log the raw response from storageService.getInstanceItem
    TimelineLogger.debug(
      "[TEST] Raw response from storageService.getInstanceItem",
      {
        response,
      },
    );

    // Log the value field for debugging
    TimelineLogger.debug("[DEBUG] Inspecting value field in storage response", {
      value: response.data.value,
    });

    // Parse the value field if it is a string
    let parsedValue = response.data.value;
    if (typeof parsedValue === "string") {
      try {
        parsedValue = JSON.parse(parsedValue);
      } catch (error) {
        TimelineLogger.warn("Failed to parse value field in storage response", {
          value: response.data.value,
          error: error.message,
        });
        return {};
      }
    }

    // Validate the structure of the parsed value
    if (typeof parsedValue !== "object" || !parsedValue.customItemYDelta) {
      TimelineLogger.warn("Invalid data structure in parsed storage value", {
        parsedValue,
      });
      return {};
    }

    // Ensure customItemYDelta is extracted correctly
    const { customItemYDelta } = parsedValue;
    if (!customItemYDelta || typeof customItemYDelta !== "object") {
      TimelineLogger.warn(
        "Invalid or missing customItemYDelta in parsed storage value",
        {
          parsedValue,
        },
      );
      return {};
    }

    TimelineLogger.debug("[TEST] Data fetched from Monday storage", {
      positionData: { customItemYDelta },
    });

    return {
      boardId: parsedValue.boardId,
      customItemYDelta,
    };
  } catch (error) {
    TimelineLogger.error(
      "Failed to load item positions from Monday storage",
      error,
    );
    return { boardId, customItemYDelta: {} };
  }
};

export default loadItemPositionsFromStorage;
