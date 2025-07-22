import mondaySdk from "monday-sdk-js";

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

const fetchBoardItems = async (context, itemIds, setBoardItems, setIsLoading, setError) => {
  if (!context || !context.boardId) return;
  
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
        }
      }
    }`;
            
    const response = await monday.api(query);
    
    if (itemIds && itemIds.length > 0) {
      // Handle response for specific items query
      if (response.data && response.data.items) {
        setBoardItems(response.data.items);
        // console.log('Specific board items fetched:', response.data.items);
      } else {
        console.warn('No items found for the specified IDs');
        setBoardItems([]);
      }
    } else {
      // Handle response for all items query
      if (response.data && response.data.boards && response.data.boards.length > 0) {
        setBoardItems(response.data.boards[0].items_page.items);
        // console.log('Board items fetched:', response.data.boards[0].items_page.items);
      } else {
        console.warn('No board data found');
        setBoardItems([]);
      }
    }
    setIsLoading(false);
  }
};

export default fetchBoardItems;
