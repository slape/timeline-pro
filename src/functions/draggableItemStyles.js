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
  zIndex: isDragging ? 1000 : 'auto',
  transform: 'translateX(-50%)', // Center the item horizontally
  transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease, left 0.2s ease',
});

/**
 * Get the inner wrapper styles
 */
export const getInnerWrapperStyles = () => ({
  position: 'relative',
  width: '100%',
  height: '100%',
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
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'visible' // Allow button to overflow
});
