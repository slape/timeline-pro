import TimelineLogger from '../utils/logger';
import { HIDDEN_ITEMS_KEY } from '../utils/configConstants';

const saveHiddenItemsToStorage = async (storageService, hiddenItemIds) => {
  if (!storageService) {
    TimelineLogger.debug('Storage service not initialized, skipping save');
    return;
  }
  try {
    // Ensure we're saving an array
    const itemsToSave = Array.isArray(hiddenItemIds) ? hiddenItemIds : [];
    TimelineLogger.debug('Saving hidden items to Monday storage', { 
      count: itemsToSave.length,
      items: itemsToSave,
      type: typeof itemsToSave
    });
    const response = await storageService.setInstanceItem(HIDDEN_ITEMS_KEY, itemsToSave);
    if (response?.data?.success) {
      TimelineLogger.debug('Successfully saved hidden items to Monday storage', { count: itemsToSave.length });
    } else {
      TimelineLogger.error('Failed to save hidden items to Monday storage', response?.data?.error);
    }
  } catch (error) {
    TimelineLogger.error('Failed to save hidden items to Monday storage', error);
  }
};

export default saveHiddenItemsToStorage;
