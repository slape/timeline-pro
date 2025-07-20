import { calculateItemPosition } from './timelineUtils';

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
  return itemsWithDates.map((item, index) => {
    const timelinePosition = calculateItemPosition(item.date, startDate, endDate);
    
    // Calculate visual positioning for the draggable item
    // Position items in a staggered layout to avoid overlap
    const verticalOffset = (index % 3) * 80; // Stagger items vertically
    const horizontalOffset = timelinePosition; // Align with timeline position initially
    
    return {
      ...item,
      timelinePosition, // Position on the timeline (0-100%)
      visualPosition: {
        x: horizontalOffset,
        y: position === 'above' ? -120 - verticalOffset : 80 + verticalOffset
      },
      index
    };
  });
}
