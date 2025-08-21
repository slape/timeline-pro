import TimelineLogger from "../utils/logger";
import saveItemYDeltasToStorage from "./saveItemPositionsToStorage";

/**
 * Resets item positions to defaults and clears custom Y-deltas.
 * @param {Object} params
 * @param {Function} get - Zustand store getter
 * @param {Function} set - Zustand store setter
 * @param {any} storageService - Monday storage service
 * @param {string} boardId - Board ID for storage
 */
export default function resetItemPositions({ set, storageService, boardId }) {
  TimelineLogger.debug("Resetting item positions to defaults", { boardId });

  // Clear custom Y-deltas
  set({
    customItemYDelta: {},
    itemPositionsLoaded: true,
    itemPositionsError: null,
  });

  // Persist the cleared state
  saveItemYDeltasToStorage(storageService, boardId, {});
}
