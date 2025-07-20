/**
 * Calculates positions for timeline items based on chronological order, position settings, and same-date handling
 * @param {Array} items - Array of timeline items with dates
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {string} position - Position setting ('above', 'below', 'alternate')
 * @returns {Array} Array of items with calculated render positions
 */
export function calculateTimelineItemPositions(items, startDate, endDate, position) {
  if (!items || items.length === 0) {
    return [];
  }

  // Sort all items chronologically
  const sortedItems = items.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Group items by date to handle same-date overlapping
  const itemsByDate = {};
  sortedItems.forEach(item => {
    const dateKey = new Date(item.date).toDateString();
    if (!itemsByDate[dateKey]) {
      itemsByDate[dateKey] = [];
    }
    itemsByDate[dateKey].push(item);
  });
  
  // Calculate positions for all items
  const renderedItems = [];
  let globalIndex = 0;
  
  Object.keys(itemsByDate).forEach(dateKey => {
    const dateItems = itemsByDate[dateKey];
    const baseDate = new Date(dateKey);
    
    // Calculate horizontal position based on date
    const timeRange = endDate - startDate;
    const datePosition = ((baseDate - startDate) / timeRange) * 100;
    
    dateItems.forEach((item, sameDateIndex) => {
      let itemPosition;
      let verticalOffset = 0;
      let horizontalOffset = 0;
      
      // Determine position based on setting
      if (position === 'above') {
        itemPosition = 'above';
        // For same-date items, stack them with slight overlap
        // Timeline is at 75%, so items need to be positioned relative to that
        verticalOffset = -80 - (sameDateIndex * 20); // Stack upward with 20px overlap
        horizontalOffset = sameDateIndex * 10; // Slight horizontal offset
      } else if (position === 'below') {
        itemPosition = 'below';
        // For same-date items, stack them with slight overlap
        // Timeline is at 25%, so items need to be positioned relative to that
        verticalOffset = 80 + (sameDateIndex * 20); // Stack downward with 20px overlap
        horizontalOffset = sameDateIndex * 10; // Slight horizontal offset
      } else { // alternate
        // Alternate between above and below for same-date items
        if (sameDateIndex % 2 === 0) {
          itemPosition = globalIndex % 2 === 0 ? 'below' : 'above';
        } else {
          itemPosition = globalIndex % 2 === 0 ? 'above' : 'below';
        }
        
        // Timeline is centered at 50% for alternating, with increased offset for above items for better visual balance
        verticalOffset = itemPosition === 'above' ? -150 : 120;
        horizontalOffset = sameDateIndex * 15; // More horizontal offset for alternating
      }
      
      // Ensure items stay within display bounds
      const finalHorizontalPosition = Math.max(5, Math.min(90, datePosition + (horizontalOffset / 10))); // Keep within 5-90% with margin
      const maxVerticalOffset = 200; // Maximum distance from timeline
      const finalVerticalOffset = Math.max(-maxVerticalOffset, Math.min(maxVerticalOffset, verticalOffset));
      
      renderedItems.push({
        ...item,
        renderPosition: {
          x: finalHorizontalPosition,
          y: finalVerticalOffset,
          zIndex: 10 + sameDateIndex // Higher z-index for overlapping items
        }
      });
      
      globalIndex++;
    });
  });
  
  return renderedItems;
}
