import TimelineLogger from "../utils/logger";
import resetItemPositions from "./resetItemPositions";

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

  if (currentPositionSetting === newSetting) {
    TimelineLogger.debug("Position setting unchanged, skipping reset.");
    return;
  }

  TimelineLogger.debug("Position setting changed", {
    from: currentPositionSetting,
    to: newSetting,
  });

  // Update the position setting in the store
  set({ currentPositionSetting: newSetting });

  // Trigger reset logic
  resetItemPositions({ get, set, storageService, boardId });
}
