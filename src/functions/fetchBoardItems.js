import mondaySdk from "monday-sdk-js";

// Initialize monday SDK
const monday = mondaySdk();

/**
 * Fetches board items from monday.com using the provided context
 * @param {Object} context - The monday.com context containing boardId
 * @param {Function} setBoardItems - State setter function for board items
 * @param {Function} setIsLoading - State setter function for loading state
 * @param {Function} setError - State setter function for error state
 * @returns {Promise<void>}
 */

const fetchBoardItems = async (context, setBoardItems, setIsLoading, setError) => {
  if (!context || !context.boardId) return;
  
  setIsLoading(true);
  setError(null);
  
  try {
    const query = `query {
        boards(ids: ${context.boardId}) {
          items_page(limit: 500) {
            cursor
            items {
              id
              name
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
          }
        }
      }`;
            
    const response = await monday.api(query);
    
    if (response.data && response.data.boards && response.data.boards.length > 0) {
      setBoardItems(response.data.boards[0].items_page.items);
      console.log('Board items fetched:', response.data.boards[0].items_page.items);
    } else {
      console.warn('No board data found');
      setBoardItems([]);
    }
  } catch (err) {
    console.error('Error fetching board items:', err);
    setError('Failed to load board items');
    setBoardItems([]);
  } finally {
    setIsLoading(false);
  }
};

export default fetchBoardItems;
