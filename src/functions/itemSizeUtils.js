/**
 * Utility functions for calculating item sizes and configurations
 * Centralizes size-related constants and calculations
 */

// Size constants - eliminates magic numbers
export const ITEM_SIZE_CONSTANTS = {
  CIRCLE_SIZE: 100,
  RECTANGLE_WIDTH: 140,
  RECTANGLE_HEIGHT_WITH_DATES: 80,
  RECTANGLE_HEIGHT_WITHOUT_DATES: 60,
  // Legacy constants for backward compatibility
  LEGACY_RECTANGLE_HEIGHT_WITH_DATES: 50,
  LEGACY_RECTANGLE_HEIGHT_WITHOUT_DATES: 30
};

/**
 * Calculate initial size based on shape and whether dates are shown
 * @param {string} shape - 'circle' or 'rectangle'
 * @param {boolean} showItemDates - Whether dates are displayed
 * @param {boolean} useLegacySizes - Whether to use legacy height values (default: false)
 * @returns {Object} Size object with width and height
 */
export const calculateInitialSize = (shape, showItemDates, useLegacySizes = false) => {
  if (shape === 'circle') {
    return {
      width: ITEM_SIZE_CONSTANTS.CIRCLE_SIZE,
      height: ITEM_SIZE_CONSTANTS.CIRCLE_SIZE
    };
  }
  
  // For rectangles, use legacy or new height values
  const heightWithDates = useLegacySizes 
    ? ITEM_SIZE_CONSTANTS.LEGACY_RECTANGLE_HEIGHT_WITH_DATES 
    : ITEM_SIZE_CONSTANTS.RECTANGLE_HEIGHT_WITH_DATES;
    
  const heightWithoutDates = useLegacySizes 
    ? ITEM_SIZE_CONSTANTS.LEGACY_RECTANGLE_HEIGHT_WITHOUT_DATES 
    : ITEM_SIZE_CONSTANTS.RECTANGLE_HEIGHT_WITHOUT_DATES;
  
  return {
    width: ITEM_SIZE_CONSTANTS.RECTANGLE_WIDTH,
    height: showItemDates ? heightWithDates : heightWithoutDates
  };
};

/**
 * Check if size needs to be updated based on shape or date display changes
 * @param {Object} currentSize - Current size object
 * @param {string} shape - Current shape
 * @param {boolean} showItemDates - Whether dates are displayed
 * @param {boolean} useLegacySizes - Whether to use legacy height values
 * @returns {boolean} True if size needs updating
 */
export const shouldUpdateSize = (currentSize, shape, showItemDates, useLegacySizes = false) => {
  const expectedSize = calculateInitialSize(shape, showItemDates, useLegacySizes);
  return currentSize.width !== expectedSize.width || currentSize.height !== expectedSize.height;
};
