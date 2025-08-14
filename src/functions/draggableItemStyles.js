import { DRAGGABLE_ITEM_STYLES, UI_COMPONENTS } from '../utils/configConstants';

/**
 * Styling utilities for draggable timeline items
 * Centralizes style calculations and constants
 */

/**
 * Get the main container styles for a draggable item
 */
export const getContainerStyles = (position, size, isDragging) => ({
  position: 'absolute',
  left: `${position.x}%`,
  top: `${position.y}px`,
  width: `${size.width}px`,
  height: `${size.height}px`,
  cursor: isDragging ? 'grabbing' : 'grab',
  zIndex: isDragging ? DRAGGABLE_ITEM_STYLES.Z_INDEX_DRAGGING : DRAGGABLE_ITEM_STYLES.Z_INDEX_NORMAL,
  transform: DRAGGABLE_ITEM_STYLES.CENTER_TRANSFORM, // Center the item horizontally
  transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease, left 0.2s ease',
});

/**
 * Get the inner wrapper styles
 */
export const getInnerWrapperStyles = () => ({
  position: 'relative',
  width: UI_COMPONENTS.FULL_WIDTH,
  height: UI_COMPONENTS.FULL_HEIGHT,
});

/**
 * Get the Box component styles for the item shape
 */
export const getBoxStyles = (isDragging, itemColor, shapeStyles) => ({
  opacity: isDragging ? 0.8 : 1,
  cursor: 'grab',
  backgroundColor: itemColor,
  ...shapeStyles,
  border: '1px solid rgba(0, 0, 0, 0.1)',
  boxShadow: isDragging 
    ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)' 
    : '0 2px 6px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)',
  transition: 'box-shadow 0.2s, opacity 0.2s, border-color 0.2s',
  userSelect: 'none',
  width: UI_COMPONENTS.FULL_WIDTH,
  height: UI_COMPONENTS.FULL_HEIGHT,
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'visible' // Allow button to overflow
});
