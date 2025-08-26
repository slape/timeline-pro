import TimelineLogger from "../utils/logger";
import resetItemPositions from "./resetItemPositions";

/**
 * Updates the timeline position setting and persists changes.
 * Always resets positions to defaults for any setting change to prevent off-screen items.
 *
 * @param {Object} params
 * @param {Function} get - Zustand store getter
 * @param {Function} set - Zustand store setter
 * @param {string} newSetting - The new position setting
 * @param {Object} monday - Monday SDK instance
 */
export function updatePositionSetting({ get, set, newSetting, monday }) {
  const { currentPositionSetting, context } = get();
  const boardId = context?.boardId;

  if (!boardId) {
    TimelineLogger.warn(
      "[POS] Cannot update position setting: no boardId available",
    );
    return;
  }

  if (currentPositionSetting === newSetting) {
    TimelineLogger.debug("[POS] Position setting unchanged, skipping reset.");
    return;
  }

  TimelineLogger.debug("[POS] Position setting changed", {
    from: currentPositionSetting,
    to: newSetting,
  });

  // Update the position setting in the store
  set({ currentPositionSetting: newSetting });

  // Trigger reset logic - with Row/Lane model, this is optional as positions remain valid across setting changes
  // But keeping it for now to ensure a clean slate when changing settings
  resetItemPositions({ set, monday, boardId });
}
