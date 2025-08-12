import TimelineLogger from '../utils/logger';

/**
 * Updates the date value for a specific item column on Monday.com
 * Uses column type information to apply the correct schema
 * 
 * @param {Object} mondaySDK - Monday.com SDK instance
 * @param {string|number} itemId - The ID of the item to update
 * @param {string|number} boardId - The ID of the board containing the item
 * @param {string} columnId - The ID of the date column to update
 * @param {Date|string} newDate - The new date value (Date object or string)
 * @param {string} columnType - The column type ('date', 'timerange', etc.) from board data
 * @param {string} newTime - Optional time in HH:MM:SS format
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
const updateItemDate = async (mondaySDK, itemId, boardId, columnId, newDate, columnType, newTime = null, currentColumnValue = null) => {
  try {
    // Validate inputs
    if (!mondaySDK) {
      throw new Error('Monday SDK is required');
    }
    
    if (!itemId || !boardId || !columnId) {
      throw new Error('Item ID, Board ID, and Column ID are required');
    }
    
    if (!newDate) {
      throw new Error('New date is required');
    }

    console.log('[updateItemDate] Starting update with params:', {
      itemId,
      columnId,
      newDate: newDate instanceof Date ? newDate.toISOString() : newDate,
      newTime,
      columnType
    });
    
    console.log('[updateItemDate] Column type check:', {
      columnType,
      isTimeline: columnType === 'timeline',
      typeOfColumnType: typeof columnType
    });

    // Convert date to YYYY-MM-DD format for Monday.com API
    let dateString;
    if (newDate instanceof Date) {
      // Convert to UTC and format as YYYY-MM-DD
      const year = newDate.getUTCFullYear();
      const month = String(newDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(newDate.getUTCDate()).padStart(2, '0');
      dateString = `${year}-${month}-${day}`;
    } else if (typeof newDate === 'string') {
      // Assume it's already in the correct format
      dateString = newDate;
    } else {
      throw new Error('Invalid date format. Expected Date object or string.');
    }

    TimelineLogger.debug('Updating item date', {
      itemId,
      boardId,
      columnId,
      columnType,
      dateString,
      newTime
    });

    // Prepare the GraphQL mutation using JSON format with correct schema based on column type
    let columnValues;
    
    if (columnType === 'timeline') {
      // Timeline columns: {from, to} - both fields are required by Monday.com API
      // Extract existing 'from' date from current column value
      let fromDate = null;
      
      if (currentColumnValue && currentColumnValue.value) {
        try {
          const parsedValue = JSON.parse(currentColumnValue.value);
          fromDate = parsedValue.from;
        } catch (error) {
          console.warn('[updateItemDate] Failed to parse current timeline value:', error);
        }
      }
      
      console.log('[updateItemDate] Timeline column update:', {
        columnId,
        currentFromDate: fromDate,
        newToDate: dateString,
        currentColumnValue: currentColumnValue
      });
      
      columnValues = JSON.stringify({
        [columnId]: {
          from: fromDate, // Keep existing start date
          to: dateString  // Update end date
        }
      });
    } else {
      // Regular date columns: {date, time, icon, changed_at}
      if (newTime) {
        columnValues = JSON.stringify({
          [columnId]: {
            date: dateString,
            time: newTime,
            icon: null, // Let Monday.com handle this
            changed_at: new Date().toISOString()
          }
        });
      } else {
        columnValues = JSON.stringify({
          [columnId]: {
            date: dateString,
            icon: null, // Let Monday.com handle this
            changed_at: new Date().toISOString()
          }
        });
      }
    }
    
    const mutation = `
      mutation {
        change_multiple_column_values(
          item_id: ${itemId}, 
          board_id: ${boardId}, 
          column_values: "${columnValues.replace(/"/g, '\\"')}"
        ) {
          id
          column_values {
            id
            text
            value
          }
        }
      }
    `;
    
    TimelineLogger.debug('GraphQL mutation details', {
      itemId,
      boardId,
      columnId,
      columnType,
      dateString,
      newTime,
      columnValues,
      escapedColumnValues: columnValues.replace(/"/g, '\\"'),
      fullMutation: mutation
    });
    
    // Execute the mutation using Monday SDK
    const response = await mondaySDK.api(mutation);
    
    TimelineLogger.debug('Monday.com API response', {
      itemId,
      boardId,
      columnId,
      response: JSON.stringify(response, null, 2)
    });
    
    if (response.errors && response.errors.length > 0) {
      const errorMessage = response.errors.map(err => err.message).join(', ');
      TimelineLogger.error('Monday.com API returned errors', {
        itemId,
        boardId,
        columnId,
        columnType,
        dateString,
        newTime,
        errors: response.errors
      });
      throw new Error(`Monday.com API error: ${errorMessage}`);
    }
    
    if (!response.data || !response.data.change_multiple_column_values) {
      TimelineLogger.error('Invalid response from Monday.com API', {
        itemId,
        boardId,
        columnId,
        response
      });
      throw new Error('Invalid response from Monday.com API');
    }
    
    TimelineLogger.debug('Item date updated successfully', {
      itemId,
      boardId,
      columnId,
      columnType,
      dateString,
      newTime,
      updatedItem: response.data.change_multiple_column_values
    });
    
    return {
      success: true,
      data: response.data.change_multiple_column_values
    };
    
  } catch (error) {
    TimelineLogger.error('Failed to update item date', {
      itemId,
      boardId,
      columnId,
      columnType,
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.message
    };
  }
};

export default updateItemDate;
