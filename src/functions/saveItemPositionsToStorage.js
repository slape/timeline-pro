import TimelineLogger from '../utils/logger';
import { ITEM_POSITIONS_KEY_PREFIX } from '../utils/configConstants';

const saveItemPositionsToStorage = async (storageService, boardId, positionSetting, itemPositions) => {
  if (!storageService || !boardId) {
    TimelineLogger.debug('Storage service not initialized or no boardId, skipping save');
    return;
  }
  try {
    const storageKey = `${ITEM_POSITIONS_KEY_PREFIX}-${boardId}`;
    const dataToSave = {
      boardId,
      positionSetting,
      itemPositions: itemPositions || {}
    };
    TimelineLogger.debug('Saving item positions to Monday storage', {
      boardId,
      positionSetting,
      itemCount: Object.keys(dataToSave.itemPositions).length
    });
    const response = await storageService.setInstanceItem(storageKey, dataToSave);
    if (response?.data?.success) {
      TimelineLogger.debug('Successfully saved item positions to Monday storage', {
        boardId,
        itemCount: Object.keys(dataToSave.itemPositions).length
      });
    } else {
      TimelineLogger.error('Failed to save item positions to Monday storage', response?.data?.error);
    }
  } catch (error) {
    TimelineLogger.error('Failed to save item positions to Monday storage', error);
  }
};

export default saveItemPositionsToStorage;
