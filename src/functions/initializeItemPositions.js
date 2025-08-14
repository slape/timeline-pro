import TimelineLogger from '../utils/logger';
import loadItemPositionsFromStorage from './loadItemPositionsFromStorage';

/**
 * Initializes item positions from Monday.com storage and updates the store.
 * @param {Object} params
 * @param {Function} get - Zustand store getter
 * @param {Function} set - Zustand store setter
 * @param {any} storageService - Monday storage service
 */
export async function initializeItemPositions({ get, set, storageService }) {
  const { context } = get();
  const boardId = context?.boardId;

  if (!boardId) {
    TimelineLogger.warn('Cannot initialize item positions: no boardId available');
    set({ itemPositionsLoaded: true, itemPositionsError: 'No board ID available' });
    return;
  }

  try {
    TimelineLogger.debug('🔄 Loading item positions from Monday storage...', { boardId });
    if (!storageService) {
      TimelineLogger.warn('Storage service not initialized for item positions');
      set({ itemPositionsLoaded: true, itemPositionsError: 'Storage service not available' });
      return;
    }
    const positionData = await loadItemPositionsFromStorage(storageService, boardId);
    TimelineLogger.debug('✅ Setting item positions in store', {
      boardId,
      positionSetting: positionData.positionSetting,
      itemCount: Object.keys(positionData.itemPositions || {}).length,
      itemPositionsLoaded: true
    });
    set({
      customItemPositions: positionData.itemPositions || {},
      currentPositionSetting: positionData.positionSetting,
      itemPositionsLoaded: true,
      itemPositionsError: null
    });
    TimelineLogger.debug('✅ Item positions loaded and store updated', {
      itemCount: Object.keys(positionData.itemPositions || {}).length,
      itemPositionsLoaded: true
    });
  } catch (error) {
    TimelineLogger.error('❌ Failed to initialize item positions', error);
    set({
      itemPositionsLoaded: true,
      itemPositionsError: error.message || 'Failed to load positions'
    });
  }
}
