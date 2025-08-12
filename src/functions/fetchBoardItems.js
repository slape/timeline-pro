import mondaySdk from "monday-sdk-js";
import TimelineLogger from '../utils/logger';

// Initialize monday SDK
const monday = mondaySdk();

/**
 * Fetches board items from monday.com using the provided context
 * @param {Object} context - The monday.com context containing boardId
 * @param {Array<string>} itemIds - Optional array of specific item IDs to fetch
 * @param {Function} setBoardItems - State setter function for board items
 * @param {Function} setIsLoading - State setter function for loading state
 * @param {Function} setError - State setter function for error state
 * @returns {Promise<void>}
 */

const fetchBoardItems = async (dateColumn, context, itemIds, setBoardItems, setIsLoading, setError) => {
  const startTime = Date.now();
  let dateColumnId;
  if (dateColumn && typeof dateColumn === 'object') {
    if (dateColumn.id) {
      dateColumnId = dateColumn.id;
    } else if (dateColumn.value) {
      dateColumnId = dateColumn.value; // sometimes settings store just the id under value
    } else {
      // last resort: if it's a one-key object like { some_col_id: true }
      const keys = Object.keys(dateColumn);
      dateColumnId = keys.length === 1 ? keys[0] : undefined;
    }
  } else {
    dateColumnId = dateColumn;
  }
  if (!dateColumnId) {
    TimelineLogger.warn('fetchBoardItems: Could not resolve dateColumnId from input', { dateColumn });
  }
  TimelineLogger.debug('Extracted date column ID', { dateColumnId });
  if (!context || !context.boardId) {
    TimelineLogger.warn('Invalid context provided to fetchBoardItems', { context });
    return;
  }
  
  TimelineLogger.dataOperation('fetchBoardItems.start', {
    boardId: context.boardId,
    itemCount: itemIds?.length || 0,
    hasSpecificItems: !!(itemIds && itemIds.length > 0)
  });
  
  setIsLoading(true);
  setError(null);
  
  let query;
  
  if (itemIds && itemIds.length > 0) {
    // Query specific items by their IDs
    const itemIdsString = itemIds.map(id => `"${id}"`).join(', ');
    query = `query {
      items(ids: [${itemIdsString}]) {
        id
        name
        board {
          id
        }
        group {
          id
          title
          color
        }
        column_values {
          id
          value
          type
        }
      }
    }`;
    
    TimelineLogger.debug('GraphQL query constructed', { 
      queryType: 'specific_items',
      itemCount: itemIds.length 
    });
            
    try {
      const response = await monday.api(query);
      const duration = Date.now() - startTime;
      
      TimelineLogger.performance('fetchBoardItems.apiCall', duration);
      
      if (itemIds && itemIds.length > 0) {
        // Handle response for specific items query
        if (response.data && response.data.items) {
          TimelineLogger.dataOperation('fetchBoardItems.success', {
            itemCount: response.data.items.length,
            queryType: 'specific_items'
          });
          // Keep all column_values to support date column switching
          // Previously we filtered to only the selected date column, but this prevents
          // switching between different date columns without re-fetching
          setBoardItems(response.data.items);
          TimelineLogger.debug('fetchBoardItems.keepingAllColumns', { 
            dateColumnId, 
            totalColumns: response.data.items[0]?.column_values?.length,
            availableColumns: response.data.items[0]?.column_values?.map(cv => cv.id)
          });
        } else {
          TimelineLogger.warn('No items found for the specified IDs', { itemIds });
          setBoardItems([]);
        }
      } else {
        // Handle response for all items query
        if (response.data && response.data.boards && response.data.boards.length > 0) {
          TimelineLogger.dataOperation('fetchBoardItems.success', {
            itemCount: response.data.boards[0].items_page.items.length,
            queryType: 'all_items'
          });
          // Keep all column_values to support date column switching
          // Previously we filtered to only the selected date column, but this prevents
          // switching between different date columns without re-fetching
          setBoardItems(response.data.boards[0].items_page.items);
          TimelineLogger.debug('fetchBoardItems.keepingAllColumns', { 
            dateColumnId, 
            totalColumns: response.data.boards[0].items_page.items[0]?.column_values?.length,
            availableColumns: response.data.boards[0].items_page.items[0]?.column_values?.map(cv => cv.id)
          });
        } else {
          TimelineLogger.warn('No board data found');
          setBoardItems([]);
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      TimelineLogger.error('fetchBoardItems.failed', error, {
        boardId: context.boardId,
        itemCount: itemIds?.length || 0,
        duration: `${duration}ms`
      });
      setError('Failed to fetch board items');
    } finally {
      setIsLoading(false);
    }
  }
};

export default fetchBoardItems;
