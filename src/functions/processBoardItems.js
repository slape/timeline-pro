import { calculateItemPosition } from './timelineUtils';
import TimelineLogger from '../utils/logger';

// Helper function to create date-only Date objects for consistent comparison
const toDateOnly = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Processes board items with dates and calculates their positions relative to the timeline
 * 
 * @param {Array} itemsWithDates - Array of board items that have dates
 * @param {Date} startDate - Start date of the timeline
 * @param {Date} endDate - End date of the timeline
 * @param {string} position - Position of items relative to timeline ('above' or 'below')
 * @returns {Array} Array of processed items with timeline and visual positions
 */
export default function processBoardItems(itemsWithDates, startDate, endDate, position) {
  const startTime = Date.now();
  
  TimelineLogger.debug('processBoardItems.start', {
    itemCount: itemsWithDates?.length || 0,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    position
  });
  
  if (!itemsWithDates || itemsWithDates.length === 0) {
    TimelineLogger.warn('processBoardItems: No items with dates provided');
    return [];
  }
  
  // Convert start and end dates to date-only for consistent comparison
  const startDateOnly = toDateOnly(startDate);
  const endDateOnly = toDateOnly(endDate);
  
  // Calculate the total time span in milliseconds
  const totalTime = endDateOnly - startDateOnly;
  
  if (totalTime <= 0) {
    TimelineLogger.warn('processBoardItems: Invalid date range', {
      startDate: startDateOnly.toISOString(),
      endDate: endDateOnly.toISOString(),
      totalTime
    });
  }
  
  const processedItems = itemsWithDates.map((item, index) => {
    // Convert item date to date-only for consistent comparison
    const itemDateOnly = toDateOnly(item.date);
    
    // Calculate position based on date-only values
    const itemTime = itemDateOnly - startDateOnly;
    let timelinePosition = (itemTime / totalTime) * 100;
    
    // Clamp position between 0 and 100
    timelinePosition = Math.max(0, Math.min(100, timelinePosition));
    
    // Calculate visual positioning for the draggable item
    // Position items in a staggered layout to avoid overlap
    const verticalOffset = (index % 3) * 80; // Stagger items vertically
    const horizontalOffset = timelinePosition; // Align with timeline position initially
    
    return {
      ...item,
      timelinePosition, // Position on the timeline (0-100%)
      visualPosition: {
        x: horizontalOffset,
        y: position === 'above' ? -60 - (verticalOffset * 0.7) : 40 + (verticalOffset * 0.7)
      },
      index
    };
  });
  
  const duration = Date.now() - startTime;
  TimelineLogger.performance('processBoardItems.complete', duration, {
    inputCount: itemsWithDates.length,
    outputCount: processedItems.length,
    position
  });
  
  return processedItems;
}
