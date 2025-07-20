/**
 * Calculates spacing and positioning for timeline items to prevent overlaps
 * 
 * @param {Array} processedItems - Array of processed board items with timeline positions
 * @param {string} position - Position setting ('above', 'below', 'alternate')
 * @param {number} itemWidth - Width of each item in pixels (default: 300)
 * @param {number} itemHeight - Height of each item in pixels (default: 80)
 * @param {number} verticalSpacing - Vertical spacing between stacked items (default: 90)
 * @param {number} horizontalPadding - Minimum horizontal padding between items (default: 20)
 * @returns {Array} Array of items with calculated x, y positions and positioning info
 */
const calculateItemSpacing = (
  processedItems, 
  position = 'below', 
  itemWidth = 300, 
  itemHeight = 80, 
  verticalSpacing = 90,
  horizontalPadding = 20
) => {
  if (!processedItems || processedItems.length === 0) {
    return [];
  }

  // Sort items by timeline position to process them left to right
  const sortedItems = [...processedItems].sort((a, b) => a.timelinePosition - b.timelinePosition);
  
  // Track occupied spaces for collision detection
  const occupiedSpaces = {
    above: [],
    below: []
  };

  return sortedItems.map((item, index) => {
    // Determine item position based on the position prop
    let itemPosition = position;
    
    // If position is 'alternate', alternate between 'above' and 'below'
    if (position === 'alternate') {
      itemPosition = index % 2 === 0 ? 'below' : 'above';
    }

    // Calculate horizontal position based on timeline position
    // Convert percentage to pixel position (assuming container width)
    const timelineX = (item.timelinePosition / 100) * 100; // This will be adjusted by CSS percentage
    
    // Find available vertical slot to avoid overlaps
    let verticalSlot = 0;
    const currentSpaces = occupiedSpaces[itemPosition];
    
    // Check for horizontal overlaps and find the first available vertical slot
    let foundSlot = false;
    while (!foundSlot) {
      const proposedY = itemPosition === 'above' 
        ? -(verticalSpacing + (verticalSlot * verticalSpacing))
        : verticalSpacing + (verticalSlot * verticalSpacing);
      
      // Check if this slot conflicts with existing items
      const hasConflict = currentSpaces.some(space => {
        const horizontalOverlap = Math.abs(space.x - timelineX) < (itemWidth + horizontalPadding);
        const verticalOverlap = space.slot === verticalSlot;
        return horizontalOverlap && verticalOverlap;
      });
      
      if (!hasConflict) {
        foundSlot = true;
        // Record this space as occupied
        currentSpaces.push({
          x: timelineX,
          y: proposedY,
          slot: verticalSlot,
          width: itemWidth,
          height: itemHeight
        });
      } else {
        verticalSlot++;
      }
    }

    // Calculate final position
    const finalY = itemPosition === 'above' 
      ? -(verticalSpacing + (verticalSlot * verticalSpacing))
      : verticalSpacing + (verticalSlot * verticalSpacing);

    return {
      ...item,
      positioning: {
        x: timelineX,
        y: finalY,
        position: itemPosition,
        slot: verticalSlot,
        width: itemWidth,
        height: itemHeight
      }
    };
  });
};

export default calculateItemSpacing;
