import { determineTimelineScale, calculateItemPosition } from './timelineUtils';
import { getItemsWithDates } from './getItemsWithDates';

/**
 * Processes board items to extract timeline data and parameters
 * @param {Array} boardItems - Array of board items from monday.com
 * @param {Object} settings - Settings object containing date column configuration
 * @param {string} scale - Timeline scale setting
 * @returns {Object|null} Object containing timelineParams and timelineItems, or null if processing fails
 */
export function processTimelineData(boardItems, settings, scale) {
  if (!boardItems || boardItems.length === 0) {
    console.log('No board items available');
    return null;
  }

  try {
    // Find the date column ID (first key in the date object)
    const dateColumn = Object.keys(settings.date || {})[0];

    if (!dateColumn) {
      console.warn('No date column selected in settings');
      return null;
    }
    
    // Extract dates from board items using the imported function
    const itemsWithDates = getItemsWithDates(boardItems, dateColumn);
    
    if (itemsWithDates.length === 0) {
      console.warn('No valid dates found in board items');
      return null;
    }
    
    // Find min and max dates
    const dates = itemsWithDates.map(item => item.date);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Add padding to the timeline (10% on each side)
    const timeRange = maxDate - minDate;
    const padding = timeRange * 0.1;
    
    const startDate = new Date(minDate.getTime() - padding);
    const endDate = new Date(maxDate.getTime() + padding);
    
    // Determine appropriate scale
    const timelineScale = determineTimelineScale(startDate, endDate, scale);
    
    // Create timeline parameters
    const timelineParams = {
      startDate,
      endDate,
      scale: timelineScale
    };
    
    // Create timeline items with positions
    const timelineItems = itemsWithDates.map(item => {
      // Add parsed date to the original item for use in DraggableBoardItem
      const originalItemWithDate = {
        ...item.originalItem,
        parsedDate: item.date
      };
      
      return {
        id: item.id,
        label: item.label,
        date: item.date,
        position: calculateItemPosition(item.date, startDate, endDate),
        originalItem: originalItemWithDate
      };
    });
    
    return {
      timelineParams,
      timelineItems
    };
    
  } catch (error) {
    console.error('Error processing timeline data:', error);
    return null;
  }
}
