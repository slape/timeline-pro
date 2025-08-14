import TimelineLogger from '../utils/logger';

// This function requires an initialized storageService and HIDDEN_ITEMS_KEY to be in scope where called
export default async function loadHiddenItemsFromStorage(storageService, HIDDEN_ITEMS_KEY) {
  if (!storageService) {
    TimelineLogger.debug('Storage service not initialized, returning empty array');
    return [];
  }

  try {
    const response = await storageService.getInstanceItem(HIDDEN_ITEMS_KEY);
    if (response?.data?.success && response.data.value) {
      let hiddenItems = response.data.value;

      // Handle case where Monday storage returns a string instead of array
      if (typeof hiddenItems === 'string') {
        TimelineLogger.debug('Monday storage returned string, converting to array', { rawValue: hiddenItems });
        // If it's a comma-separated string, split it
        if (hiddenItems.includes(',')) {
          hiddenItems = hiddenItems.split(',').map(id => id.trim()).filter(id => id.length > 0);
        } else if (hiddenItems.length > 0) {
          // Single item as string
          hiddenItems = [hiddenItems];
        } else {
          hiddenItems = [];
        }
      }

      // Ensure it's an array
      if (!Array.isArray(hiddenItems)) {
        TimelineLogger.warn('Hidden items from storage is not an array, converting', { type: typeof hiddenItems, value: hiddenItems });
        hiddenItems = [];
      }

      TimelineLogger.debug('Loaded hidden items from Monday storage', {
        count: hiddenItems.length,
        items: hiddenItems
      });
      return hiddenItems;
    }
    return [];
  } catch (error) {
    TimelineLogger.error('Failed to load hidden items from Monday storage', error);
    return [];
  }
}
