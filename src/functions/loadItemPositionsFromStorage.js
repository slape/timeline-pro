import TimelineLogger from '../utils/logger';
import { ITEM_POSITIONS_KEY_PREFIX } from '../utils/configConstants';

const loadItemPositionsFromStorage = async (storageService, boardId) => {
  if (!storageService || !boardId) {
    TimelineLogger.debug('Storage service not initialized or no boardId, returning empty object');
    return {};
  }
  try {
    const storageKey = `${ITEM_POSITIONS_KEY_PREFIX}-${boardId}`;
    const response = await storageService.getInstanceItem(storageKey);
    if (response?.data?.success && response.data.value) {
      const positionData = response.data.value;
      // Validate the structure
      if (positionData && typeof positionData === 'object' && positionData.itemPositions) {
        TimelineLogger.debug('Loaded item positions from Monday storage', {
          boardId,
          positionSetting: positionData.positionSetting,
          itemCount: Object.keys(positionData.itemPositions).length
        });
        return positionData;
      }
    }
    return { boardId, positionSetting: null, itemPositions: {} };
  } catch (error) {
    TimelineLogger.error('Failed to load item positions from Monday storage', error);
    return { boardId, positionSetting: null, itemPositions: {} };
  }
};

export default loadItemPositionsFromStorage;
