/**
 * Configuration Constants for Timeline-Pro
 * Centralizes all magic numbers and default values for consistency and maintainability
 */

// ============================================================================
// TIMELINE LAYOUT CONSTANTS
// ============================================================================

export const TIMELINE_LAYOUT = {
  // Timeline position percentages
  POSITION_ABOVE: 0.75,     // Timeline at 75% when position is 'above'
  POSITION_BELOW: 0.25,     // Timeline at 25% when position is 'below'
  POSITION_CENTER: 0.5,     // Timeline at 50% when position is 'center'
  
  // Container dimensions
  CONTAINER_HEIGHT: 300,    // Timeline container height in pixels
  CONTAINER_PADDING: 100,   // Vertical padding for timeline container
  
  // Position calculations
  PERCENTAGE_MAX: 100,      // Maximum percentage value for positions
  PERCENTAGE_MIN: 0,        // Minimum percentage value for positions
};

// ============================================================================
// DRAGGABLE ITEM CONSTANTS
// ============================================================================

export const DRAGGABLE_ITEM = {
  // Size constraints
  MIN_SIZE: 50,             // Minimum item size for resizing
  DEFAULT_WIDTH: 100,       // Default item width
  DEFAULT_HEIGHT: 50,       // Default item height
  LARGE_WIDTH: 140,         // Large item width
  LARGE_HEIGHT: 30,         // Large item height (for text display)
  
  // Z-index values
  Z_INDEX_DRAGGING: 1000,   // Z-index when item is being dragged
  Z_INDEX_NORMAL: 'auto',   // Normal z-index value
  
  // Transform values
  CENTER_TRANSFORM: 'translateX(-50%)', // Center item horizontally
  
  // Drag bounds and distances
  MAX_DRAG_DISTANCE: 300,   // Maximum drag distance from timeline
  DRAG_DISTANCE_FACTOR: 0.7, // Factor for calculating drag bounds
  BOUNDS_PADDING: 20,       // Padding for drag bounds
  BOUNDS_MIN_X: 5,          // Minimum X position percentage
  BOUNDS_MAX_X: 95,         // Maximum X position percentage
  BOUNDS_MIN_Y: -250,       // Minimum Y position in pixels
  BOUNDS_MAX_Y: 250,        // Maximum Y position in pixels
};

// ============================================================================
// ITEM POSITIONING CONSTANTS
// ============================================================================

export const ITEM_POSITIONING = {
  // Stacking distances
  STACK_SPACING: 40,        // Spacing between stacked items (reduced from 50px)
  STACK_SPACING_OLD: 50,    // Legacy spacing for backward compatibility
  STACK_SPACING_LARGE: 60,  // Large spacing for special cases
  
  // Base offsets from timeline
  BASE_OFFSET_ABOVE: -160,  // Base offset for items above timeline
  BASE_OFFSET_BELOW: 90,    // Base offset for items below timeline
  BASE_OFFSET_ABOVE_OLD: -150, // Legacy offset above
  BASE_OFFSET_BELOW_OLD: 150,  // Legacy offset below
  
  // Maximum offsets
  MAX_OFFSET_ABOVE: 300,    // Maximum offset for items above timeline
  MAX_OFFSET_BELOW: 200,    // Maximum offset for items below timeline
  
  // Near-timeline positioning
  NEAR_TIMELINE_DISTANCE: 50, // Distance for "near timeline" positioning
};

// ============================================================================
// DATE AND TIME CONSTANTS
// ============================================================================

export const DATE_TIME = {
  // Time calculations
  MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24, // Milliseconds in a day
  DAYS_PER_WEEK: 7,         // Days in a week
  DAYS_PER_MONTH: 30,       // Average days in a month
  DAYS_PER_YEAR: 365,       // Days in a year
  DAYS_TWO_YEARS: 730,      // Days in two years
  
  // Scale intervals
  INTERVAL_DAYS: 1,         // Daily interval
  INTERVAL_WEEKS: 7,        // Weekly interval
  INTERVAL_MONTHS: 30,      // Monthly interval (approximate)
  INTERVAL_YEARS: 365,      // Yearly interval
};

// ============================================================================
// UI COMPONENT CONSTANTS
// ============================================================================

export const UI_COMPONENTS = {
  // Border radius
  CIRCLE_BORDER_RADIUS: '50%', // Full circle border radius
  
  // Dimensions
  FULL_WIDTH: '100%',       // Full width value
  FULL_HEIGHT: '100%',      // Full height value
  
  // Timeline position strings
  POSITION_ABOVE_STR: 'above',
  POSITION_BELOW_STR: 'below',
  POSITION_CENTER_STR: 'center',
  
  // Timeline position CSS values
  TIMELINE_TOP_ABOVE: '75%',
  TIMELINE_TOP_BELOW: '25%',
  TIMELINE_TOP_CENTER: '50%',
};

// ============================================================================
// CALCULATION CONSTANTS
// ============================================================================

export const CALCULATIONS = {
  // Success rate calculation
  PERCENTAGE_MULTIPLIER: 100, // For converting decimals to percentages
  
  // Rounding precision
  ROUND_TO_NEAREST: 1,      // Round to nearest whole number
  
  // Position bounds
  DEFAULT_MIN_X: 0,         // Default minimum X bound
  DEFAULT_MAX_X: 100,       // Default maximum X bound
  DEFAULT_MIN_Y: -300,      // Default minimum Y bound
  DEFAULT_MAX_Y: 300,       // Default maximum Y bound
};

// ============================================================================
// TIMELINE MARKER CONSTANTS
// ============================================================================

export const TIMELINE_MARKERS = {
  // End position
  END_POSITION: 100,        // Position for end markers (100%)
  
  // Marker spacing and positioning
  MARKER_INTERVAL_FACTOR: 1, // Factor for marker interval calculations
};

// ============================================================================
// LEGACY CONSTANTS (for backward compatibility)
// ============================================================================

export const LEGACY = {
  // Old size values that may still be referenced
  OLD_STACK_SPACING: 60,    // Old stacking spacing
  OLD_BASE_OFFSET: 150,     // Old base offset value
  
  // Deprecated values kept for migration
  DEPRECATED_WIDTH: 120,    // Deprecated width value
  DEPRECATED_HEIGHT: 40,    // Deprecated height value
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get timeline position ratio based on position setting
 * @param {string} position - Position setting ('above', 'below', 'center')
 * @returns {number} Position ratio (0.25, 0.5, or 0.75)
 */
export const getTimelinePositionRatio = (position) => {
  switch (position) {
    case UI_COMPONENTS.POSITION_ABOVE_STR:
      return TIMELINE_LAYOUT.POSITION_ABOVE;
    case UI_COMPONENTS.POSITION_BELOW_STR:
      return TIMELINE_LAYOUT.POSITION_BELOW;
    default:
      return TIMELINE_LAYOUT.POSITION_CENTER;
  }
};

/**
 * Get timeline top CSS value based on position setting
 * @param {string} position - Position setting ('above', 'below', 'center')
 * @returns {string} CSS top value ('25%', '50%', or '75%')
 */
export const getTimelineTopCSS = (position) => {
  switch (position) {
    case UI_COMPONENTS.POSITION_ABOVE_STR:
      return UI_COMPONENTS.TIMELINE_TOP_ABOVE;
    case UI_COMPONENTS.POSITION_BELOW_STR:
      return UI_COMPONENTS.TIMELINE_TOP_BELOW;
    default:
      return UI_COMPONENTS.TIMELINE_TOP_CENTER;
  }
};

/**
 * Calculate drag bounds based on timeline position
 * @param {string} position - Timeline position setting
 * @returns {Object} Bounds object with minY and maxY
 */
export const calculateDragBounds = (position) => {
  const maxDistance = DRAGGABLE_ITEM.MAX_DRAG_DISTANCE;
  const nearDistance = ITEM_POSITIONING.NEAR_TIMELINE_DISTANCE;
  
  switch (position) {
    case UI_COMPONENTS.POSITION_ABOVE_STR:
      return {
        minY: -nearDistance,
        maxY: maxDistance
      };
    case UI_COMPONENTS.POSITION_BELOW_STR:
      return {
        minY: -maxDistance * DRAGGABLE_ITEM.DRAG_DISTANCE_FACTOR,
        maxY: nearDistance
      };
    default: // center
      return {
        minY: -nearDistance,
        maxY: nearDistance
      };
  }
};
