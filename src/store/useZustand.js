import { create } from 'zustand';
import TimelineLogger from '../utils/logger';
import { MondayStorageService } from './MondayStorageService';

// console.log('Zustand store created (should appear only once per reload)'); // Suppressed for focused debugging

// Monday.com storage keys
const HIDDEN_ITEMS_KEY = 'timeline-pro-hidden-items';
const ITEM_POSITIONS_KEY_PREFIX = 'timeline-pro-item-positions';

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

// Helper functions for item positions storage
const loadItemPositionsFromStorage = async (boardId) => {
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

const saveItemPositionsToStorage = async (boardId, positionSetting, itemPositions) => {
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

export const useZustandStore = create((set, get) => ({
  settings: {},
  context: {},
  boardItems: [],
  itemIds: [],
  hiddenItemIds: [], // Will be loaded asynchronously from Monday storage
  hiddenItemsLoaded: false, // Track if hidden items have been loaded from Monday storage
  
  // Item position persistence
  customItemPositions: {}, // { itemId: { x, y } }
  currentPositionSetting: null, // Track position setting changes
  itemPositionsLoaded: false, // Loading state
  itemPositionsError: null, // Error handling
  
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

  // Item position persistence methods
  saveCustomItemPosition: (itemId, position) => {
    const { customItemPositions, context } = get();
    const boardId = context?.boardId;
    
    if (!boardId) {
      TimelineLogger.warn('Cannot save item position: no boardId available');
      return;
    }
    
    const updatedPositions = {
      ...customItemPositions,
      [itemId]: { x: position.x, y: position.y }
    };
    
    TimelineLogger.debug('Saving custom item position', { itemId, position, boardId });
    
    // Update store immediately
    set({ customItemPositions: updatedPositions });
    
    // Save to Monday storage (async)
    const { currentPositionSetting } = get();
    saveItemPositionsToStorage(boardId, currentPositionSetting, updatedPositions);
  },

  updatePositionSetting: (newSetting) => {
    const { currentPositionSetting, customItemPositions, context } = get();
    const boardId = context?.boardId;
    
    if (!boardId) {
      TimelineLogger.warn('Cannot update position setting: no boardId available');
      return;
    }
    
    TimelineLogger.debug('Position setting changed', { 
      from: currentPositionSetting, 
      to: newSetting 
    });
    
    // Handle position setting changes
    let updatedPositions = customItemPositions;
    
    if (currentPositionSetting && currentPositionSetting !== newSetting) {
      // Check if this is a simple above/below flip (mirror positions)
      const isAboveBelowFlip = 
        (currentPositionSetting === 'above' && newSetting === 'below') ||
        (currentPositionSetting === 'below' && newSetting === 'above');
      
      if (isAboveBelowFlip) {
        // Mirror Y coordinates for above/below flip
        updatedPositions = Object.fromEntries(
          Object.entries(customItemPositions).map(([itemId, pos]) => [
            itemId,
            { x: pos.x, y: -pos.y }
          ])
        );
        TimelineLogger.debug('Mirrored positions for above/below flip', { 
          itemCount: Object.keys(updatedPositions).length 
        });
      } else {
        // Reset positions for other setting changes
        updatedPositions = {};
        TimelineLogger.debug('Reset positions for position setting change', { 
          from: currentPositionSetting, 
          to: newSetting 
        });
      }
    }
    
    // Update store
    set({ 
      currentPositionSetting: newSetting,
      customItemPositions: updatedPositions
    });
    
    // Save to Monday storage (async)
    saveItemPositionsToStorage(boardId, newSetting, updatedPositions);
  },

  clearCustomPositions: () => {
    const { context } = get();
    const boardId = context?.boardId;
    
    if (!boardId) {
      TimelineLogger.warn('Cannot clear positions: no boardId available');
      return;
    }
    
    TimelineLogger.debug('Clearing all custom item positions', { boardId });
    
    // Update store
    set({ customItemPositions: {} });
    
    // Save to Monday storage (async)
    const { currentPositionSetting } = get();
    saveItemPositionsToStorage(boardId, currentPositionSetting, {});
  },

  initializeItemPositions: async (mondaySDK) => {
    const { context } = get();
    const boardId = context?.boardId;
    
    if (!boardId) {
      TimelineLogger.warn('Cannot initialize item positions: no boardId available');
      set({ itemPositionsLoaded: true, itemPositionsError: 'No board ID available' });
      return;
    }
    
    try {
      TimelineLogger.debug('🔄 Loading item positions from Monday storage...', { boardId });
      
      // Ensure storage service is available
      if (!storageService) {
        TimelineLogger.warn('Storage service not initialized for item positions');
        set({ itemPositionsLoaded: true, itemPositionsError: 'Storage service not available' });
        return;
      }
      
      const positionData = await loadItemPositionsFromStorage(boardId);
      
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
  },
}));
