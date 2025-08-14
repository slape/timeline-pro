/**
 * Persists a custom Y delta for a board item, both in store and Monday storage.
 * @param {Object} params
 * @param {Function} get - Zustand store getter
 * @param {Function} set - Zustand store setter
 * @param {string} itemId - The board item id
 * @param {number} yDelta - The new Y delta
 * @param {any} storageService - Monday storage service
 */
export function saveCustomItemYDelta({ get, set, itemId, yDelta, storageService }) {
  TimelineLogger.debug('[Y-DELTA] saveCustomItemYDelta called', { itemId, yDelta, hasStorageService: !!storageService });
  const { customItemYDelta, customItemPositions, context, currentPositionSetting } = get();
  const boardId = context?.boardId;

  if (!boardId) {
    TimelineLogger.warn('[Y-DELTA] No boardId in saveCustomItemYDelta', { itemId, yDelta });    TimelineLogger.warn('Cannot save item Y delta: no boardId available');
    return;
  }

  const updatedYDelta = {
    ...customItemYDelta,
    [itemId]: yDelta
  };
  TimelineLogger.debug('[Y-DELTA] Updating Zustand store with new Y delta', { itemId, yDelta, updatedYDelta });

  TimelineLogger.debug('Saving custom item Y delta', { itemId, yDelta, boardId });
  set({ customItemYDelta: updatedYDelta });
  TimelineLogger.debug('[Y-DELTA] Zustand store updated with customItemYDelta', { itemId, yDelta, updatedYDelta });

  // Persist both positions and Y deltas together
  if (storageService && boardId) {
    TimelineLogger.debug('[Y-DELTA] Calling saveItemPositionsToStorage with Y delta', { itemId, yDelta, updatedYDelta });
    const saveItemPositionsToStorage = require('./saveItemPositionsToStorage').default;
    saveItemPositionsToStorage(
      storageService,
      boardId,
      currentPositionSetting,
      customItemPositions,
      updatedYDelta
    );
    if (typeof TimelineLogger !== 'undefined') {
      TimelineLogger.debug('Persisted customItemPositions and customItemYDelta to Monday storage after Y delta update', {
        boardId,
        yDeltaCount: Object.keys(updatedYDelta).length,
        positionCount: Object.keys(customItemPositions || {}).length
      });
    }
  }
}
