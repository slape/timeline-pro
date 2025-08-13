import { DRAGGABLE_ITEM } from '../utils/configConstants';

/**
 * Utility functions for calculating item sizes
 * Centralizes size calculation logic and constants
 */

// Size constants - using centralized configuration
export const SIZE_CONSTANTS = {
  DEFAULT_WIDTH: DRAGGABLE_ITEM.DEFAULT_WIDTH,
  DEFAULT_HEIGHT: DRAGGABLE_ITEM.DEFAULT_HEIGHT,
  LARGE_WIDTH: DRAGGABLE_ITEM.LARGE_WIDTH,
  LARGE_HEIGHT: DRAGGABLE_ITEM.LARGE_HEIGHT,
  MIN_SIZE: DRAGGABLE_ITEM.MIN_SIZE,
  // Circle size - must be equal width and height for perfect circle
  CIRCLE_SIZE: 100,
  RECTANGLE_WIDTH: 140,
  RECTANGLE_HEIGHT_WITH_DATES: 80,
  RECTANGLE_HEIGHT_WITHOUT_DATES: 60,
  // Legacy size constants for backward compatibility
  LEGACY_WIDTH: DRAGGABLE_ITEM.DEFAULT_WIDTH,
  LEGACY_HEIGHT: DRAGGABLE_ITEM.DEFAULT_HEIGHT,
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
      width: SIZE_CONSTANTS.CIRCLE_SIZE,
      height: SIZE_CONSTANTS.CIRCLE_SIZE
    };
  }
  
  // For rectangles, use legacy or new height values
  const heightWithDates = useLegacySizes 
    ? SIZE_CONSTANTS.LEGACY_RECTANGLE_HEIGHT_WITH_DATES 
    : SIZE_CONSTANTS.RECTANGLE_HEIGHT_WITH_DATES;
    
  const heightWithoutDates = useLegacySizes 
    ? SIZE_CONSTANTS.LEGACY_RECTANGLE_HEIGHT_WITHOUT_DATES 
    : SIZE_CONSTANTS.RECTANGLE_HEIGHT_WITHOUT_DATES;
  
  return {
    width: SIZE_CONSTANTS.RECTANGLE_WIDTH,
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
