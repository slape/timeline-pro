import TimelineLogger from "../utils/logger";
import saveItemYDeltasToStorage from "./saveItemPositionsToStorage";

/**
 * Updates the timeline position setting and persists changes.
 * Always resets positions to defaults for any setting change to prevent off-screen items.
 * @param {Object} params
 * @param {Function} get - Zustand store getter
 * @param {Function} set - Zustand store setter
 * @param {string} newSetting - The new position setting
 * @param {any} storageService - Monday storage service
 */
export function updatePositionSetting({
  get,
  set,
  newSetting,
  storageService,
}) {
  const { currentPositionSetting, context } = get();
  const boardId = context?.boardId;

  if (!boardId) {
    TimelineLogger.warn("Cannot update position setting: no boardId available");
    return;
  }

  TimelineLogger.debug("Position setting changed", {
    from: currentPositionSetting,
    to: newSetting,
  });

  // For any position setting change, clear all Y-deltas and persist
  TimelineLogger.debug(
    "Clearing all custom Y-deltas for position setting change",
    { to: newSetting },
  );
  set({
    customItemYDelta: {},
    itemPositionsLoaded: true,
    itemPositionsError: null,
  });
  set({
    currentPositionSetting: newSetting,
    customItemYDelta: {},
    itemPositionsLoaded: true,
    itemPositionsError: null,
  });

  saveItemYDeltasToStorage(storageService, boardId, {});
}
