/**
 * Configuration Constants for Timeline-Pro
 * Contains ONLY actively used constants that affect layout and positioning
 * Organized by impact: Layout-affecting vs Visual-only constants
 */

// ============================================================================
// LAYOUT & POSITIONING CONSTANTS (affect item placement and timeline layout)
// ============================================================================

export const TIMELINE_LAYOUT = {
  // Timeline container dimensions - AFFECTS OVERALL LAYOUT
  CONTAINER_HEIGHT: 400,    // Timeline container height in pixels
  CONTAINER_PADDING: 50,    // Vertical padding for timeline container
  
  // Timeline position ratios - AFFECTS ITEM POSITIONING
  POSITION_ABOVE: 0.25,     // Timeline at 25% when position is 'above'
  POSITION_BELOW: 0.75,     // Timeline at 75% when position is 'below'
  POSITION_CENTER: 0.5,     // Timeline at 50% when position is 'center'
};

export const DRAGGABLE_ITEM = {
  // Item dimensions - AFFECTS VISUAL SIZE AND COLLISION
  DEFAULT_WIDTH: 40,        // Default item width
  DEFAULT_HEIGHT: 40,       // Default item height
  LARGE_WIDTH: 100,         // Large item width
  LARGE_HEIGHT: 20,         // Large item height (for text display)
  MIN_SIZE: 50,             // Minimum item size for resizing
  
  // Drag boundaries - AFFECTS WHERE ITEMS CAN BE POSITIONED
  MAX_DRAG_DISTANCE: 250,   // Maximum drag distance from timeline
  BOUNDS_MIN_X: 5,          // Minimum X position percentage
  BOUNDS_MAX_X: 95,         // Maximum X position percentage
  BOUNDS_MIN_Y: -250,       // Minimum Y position in pixels
  BOUNDS_MAX_Y: 250,        // Maximum Y position in pixels
};

// ============================================================================
// VISUAL-ONLY CONSTANTS (styling that doesn't affect positioning)
// ============================================================================

export const UI_COMPONENTS = {
  // CSS values for styling
  FULL_WIDTH: '100%',
  FULL_HEIGHT: '100%',
  
  // Position setting strings
  POSITION_ABOVE_STR: 'above',
  POSITION_BELOW_STR: 'below',
  POSITION_CENTER_STR: 'center',
  
  // Timeline position CSS values
  TIMELINE_TOP_ABOVE: '75%',
  TIMELINE_TOP_BELOW: '25%',
  TIMELINE_TOP_CENTER: '50%',
};

export const DRAGGABLE_ITEM_STYLES = {
  // Z-index and visual effects
  Z_INDEX_DRAGGING: 1000,
  Z_INDEX_NORMAL: 'auto',
  CENTER_TRANSFORM: 'translateX(-50%)',
};



// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
