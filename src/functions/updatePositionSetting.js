import TimelineLogger from '../utils/logger';
import saveItemPositionsToStorage from './saveItemPositionsToStorage';
import generateDefaultPositions from './generateDefaultPositions';

/**
 * Updates the timeline position setting and persists changes.
 * Always resets positions to defaults for any setting change to prevent off-screen items.
 * @param {Object} params
 * @param {Function} get - Zustand store getter
 * @param {Function} set - Zustand store setter
 * @param {string} newSetting - The new position setting
 * @param {any} storageService - Monday storage service
 */
export function updatePositionSetting({ get, set, newSetting, storageService }) {
  const { currentPositionSetting, customItemPositions, context, boardItems } = get();
  const boardId = context?.boardId;

  if (!boardId) {
    TimelineLogger.warn('Cannot update position setting: no boardId available');
    return;
  }

  TimelineLogger.debug('Position setting changed', {
    from: currentPositionSetting,
    to: newSetting
  });

  // Always generate fresh default positions for any position setting change
  let updatedPositions = customItemPositions;
  if (currentPositionSetting && currentPositionSetting !== newSetting) {
    updatedPositions = generateDefaultPositions(boardItems, newSetting);
    TimelineLogger.debug('Applied default positions for position setting change', {
      from: currentPositionSetting,
      to: newSetting,
      defaultPositionCount: Object.keys(updatedPositions).length,
      reason: 'Always reset to prevent off-screen items'
    });
  }

  set({
    currentPositionSetting: newSetting,
    customItemPositions: updatedPositions,
    customItemYDelta: {}, // Reset all Y deltas on position setting change
  });

  saveItemPositionsToStorage(storageService, boardId, newSetting, updatedPositions);
}
