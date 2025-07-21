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
        // For same-date items, stack them vertically with no overlap
        // Timeline is at 75%, so items need to be positioned relative to that
        verticalOffset = -100 - (sameDateIndex * 50); // Stack upward with 50px spacing (no overlap)
        horizontalOffset = 0; // No horizontal offset to maintain perpendicular lines
      } else if (position === 'below') {
        itemPosition = 'below';
        // For same-date items, stack them vertically with no overlap
        // Timeline is at 25%, so items need to be positioned relative to that
        verticalOffset = 100 + (sameDateIndex * 50); // Stack downward with 50px spacing (no overlap)
        horizontalOffset = 0; // No horizontal offset to maintain perpendicular lines
      } else { // alternate
        // Alternate between above and below for same-date items
        if (sameDateIndex % 2 === 0) {
          itemPosition = globalIndex % 2 === 0 ? 'below' : 'above';
        } else {
          itemPosition = globalIndex % 2 === 0 ? 'above' : 'below';
        }
        
        // Timeline is centered at 50% for alternating, with increased spacing to prevent overlap
        verticalOffset = itemPosition === 'above' ? -150 - (sameDateIndex * 60) : 150 + (sameDateIndex * 60);
        horizontalOffset = 0; // No horizontal offset to maintain perpendicular lines
      }
      
      // Ensure items stay within display bounds but maintain exact horizontal alignment with date marker
      // For perpendicular connector lines on initial render, keep exact datePosition with no offset
      const finalHorizontalPosition = datePosition; // Exact alignment with date position for perpendicular line
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
