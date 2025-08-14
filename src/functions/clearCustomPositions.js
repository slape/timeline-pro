import TimelineLogger from '../utils/logger';
import saveItemPositionsToStorage from './saveItemPositionsToStorage';

/**
 * Clears all custom item positions for the current board and persists the change.
 * @param {Object} params
 * @param {Function} get - Zustand store getter
 * @param {Function} set - Zustand store setter
 * @param {any} storageService - Monday storage service
 */
export function clearCustomPositions({ get, set, storageService }) {
  const { context } = get();
  const boardId = context?.boardId;

  if (!boardId) {
    TimelineLogger.warn('Cannot clear positions: no boardId available');
    return;
  }

  TimelineLogger.debug('Clearing all custom item positions', { boardId });
  set({ customItemPositions: {}, customItemYDelta: {} });

  const { currentPositionSetting } = get();
  saveItemPositionsToStorage(storageService, boardId, currentPositionSetting, {});
  // Persist cleared deltas if you add delta storage persistence in the future
  // e.g. saveItemYDeltaToStorage(storageService, boardId, {})

}
