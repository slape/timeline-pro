import { create } from 'zustand';
import TimelineLogger from '../utils/logger';
import { MondayStorageService } from './MondayStorageService';

// console.log('Zustand store created (should appear only once per reload)'); // Suppressed for focused debugging

// Monday.com storage key for hidden items
const HIDDEN_ITEMS_KEY = 'timeline-pro-hidden-items';

// Storage service instance (will be initialized when Monday SDK is available)
let storageService = null;

// Helper functions for Monday.com storage persistence
const loadHiddenItemsFromStorage = async () => {
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
};

const saveHiddenItemsToStorage = async (hiddenItemIds) => {
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

export const useZustandStore = create((set, get) => ({
  settings: {},
  context: {},
  boardItems: [],
  itemIds: [],
  hiddenItemIds: [], // Will be loaded asynchronously from Monday storage
  hiddenItemsLoaded: false, // Track if hidden items have been loaded from Monday storage
  timelineParams: {},
  timelineItems: [],
  setSettings: (settings) => {
    TimelineLogger.debug('setSettings called', settings);
    set({ settings });
  },
  setContext: (context) => {
    TimelineLogger.debug('setContext called', context);
    set({ context });
  },
  setBoardItems: (boardItems) => {
    TimelineLogger.debug('setBoardItems called', boardItems);
    set({ boardItems });
  },
  // Update a specific board item's date column value in the store
  updateBoardItemDate: (itemId, columnId, newDateValue) => {
    const { boardItems } = get();
    const updatedBoardItems = boardItems.map(item => {
      if (item.id === itemId) {
        // Update the column value for this item
        const updatedColumnValues = item.column_values.map(col => {
          if (col.id === columnId) {
            return {
              ...col,
              value: newDateValue, // Update the JSON value
              text: typeof newDateValue === 'string' ? JSON.parse(newDateValue).to || JSON.parse(newDateValue).date : col.text // Update display text
            };
          }
          return col;
        });
        
        return {
          ...item,
          column_values: updatedColumnValues
        };
      }
      return item;
    });
    
    TimelineLogger.debug('Updated board item date in store', {
      itemId,
      columnId,
      newDateValue,
      updatedItemsCount: updatedBoardItems.length
    });
    
    set({ boardItems: updatedBoardItems });
  },
  setItemIds: (itemIds) => {
    TimelineLogger.debug('setItemIds called', itemIds);
    set({ itemIds });
  },
  setHiddenItemIds: (hiddenItemIds) => {
    TimelineLogger.debug('setHiddenItemIds called', hiddenItemIds);
    saveHiddenItemsToStorage(hiddenItemIds); // Persist to Monday storage (async)
    set({ hiddenItemIds });
  },
  // Initialize Monday storage service and load hidden items
  initializeMondayStorage: async (mondaySDK) => {
    try {
      TimelineLogger.debug('🔄 Initializing Monday storage service...');
      storageService = new MondayStorageService(mondaySDK);
      TimelineLogger.debug('✅ Monday storage service initialized');
      
      // Load existing hidden items from Monday storage
      TimelineLogger.debug('🔄 Loading hidden items from Monday storage...');
      const hiddenItemIds = await loadHiddenItemsFromStorage();
      
      TimelineLogger.debug('✅ Setting hidden items in store', { 
        hiddenItemIds, 
        count: hiddenItemIds.length,
        hiddenItemsLoaded: true 
      });
      
      set({ hiddenItemIds, hiddenItemsLoaded: true });
      
      TimelineLogger.debug('✅ Hidden items loaded and store updated', { 
        count: hiddenItemIds.length,
        hiddenItemsLoaded: true
      });
    } catch (error) {
      TimelineLogger.error('❌ Failed to initialize Monday storage service', error);
      // Even if loading fails, mark as loaded to prevent infinite loading
      set({ hiddenItemsLoaded: true });
      TimelineLogger.debug('⚠️ Marked hiddenItemsLoaded as true despite error');
    }
  },
  // Helper function to hide a single item
  hideItem: (itemId) => {
    const { hiddenItemIds } = get();
    if (!hiddenItemIds.includes(itemId)) {
      const newHiddenIds = [...hiddenItemIds, itemId];
      TimelineLogger.userAction('timelineItemHidden', { itemId });
      saveHiddenItemsToStorage(newHiddenIds); // Async save to Monday storage
      set({ hiddenItemIds: newHiddenIds });
    }
  },
  // Helper function to unhide a single item
  unhideItem: (itemId) => {
    const { hiddenItemIds } = get();
    const newHiddenIds = hiddenItemIds.filter(id => id !== itemId);
    TimelineLogger.userAction('timelineItemUnhidden', { itemId });
    saveHiddenItemsToStorage(newHiddenIds); // Async save to Monday storage
    set({ hiddenItemIds: newHiddenIds });
  },
  // Helper function to unhide all items
  unhideAllItems: () => {
    TimelineLogger.userAction('allItemsUnhidden');
    saveHiddenItemsToStorage([]); // Async save to Monday storage
    set({ hiddenItemIds: [] });
  },
  // Helper function to get count of hidden items
  getHiddenItemCount: () => {
    const { hiddenItemIds } = get();
    return hiddenItemIds.length;
  },
  setTimelineParams: (timelineParams) => {
    TimelineLogger.debug('setTimelineParams called', timelineParams);
    set({ timelineParams });
  },
  setTimelineItems: (timelineItems) => {
    TimelineLogger.debug('setTimelineItems called', timelineItems);
    if (timelineItems === null) {
      set({ timelineItems: null });
      return;
    }
    
    // Handle function updates (React setState pattern)
    if (typeof timelineItems === 'function') {
      set((state) => ({ 
        timelineItems: timelineItems(state.timelineItems) 
      }));
      TimelineLogger.debug('timelineItems updated via function in store');
    } else {
      set({ timelineItems });
      TimelineLogger.debug('timelineItems set directly in store', timelineItems);
    }
  },
}));
