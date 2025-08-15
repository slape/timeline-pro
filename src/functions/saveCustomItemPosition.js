import TimelineLogger from "../utils/logger";
import saveItemPositionsToStorage from "./saveItemPositionsToStorage";

/**
 * Persists a custom item position for a board item, both in store and Monday storage.
 * @param {Object} params
 * @param {Function} get - Zustand store getter
 * @param {Function} set - Zustand store setter
 * @param {string} itemId - The board item id
 * @param {{x: number, y: number}} position - The new position
 * @param {any} storageService - Monday storage service
 */
export function saveCustomItemPosition({
  get,
  set,
  itemId,
  position,
  storageService,
}) {
  const { customItemPositions, customItemYDelta, context } = get();
  const boardId = context?.boardId;

  if (!boardId) {
    TimelineLogger.warn("Cannot save item position: no boardId available");
    return;
  }

  const updatedPositions = {
    ...customItemPositions,
    [itemId]: { x: position.x, y: position.y },
  };

  TimelineLogger.debug("Saving custom item position", {
    itemId,
    position,
    boardId,
  });
  set({ customItemPositions: updatedPositions });

  const { currentPositionSetting } = get();
  saveItemPositionsToStorage(
    storageService,
    boardId,
    currentPositionSetting,
    updatedPositions,
    customItemYDelta,
  );
}
