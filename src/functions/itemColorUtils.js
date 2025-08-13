/**
 * Utility functions for calculating item colors
 * Centralizes color logic and provides fallback handling
 */

/**
 * Get item color based on group color or fallback to theme primary
 * @param {Object} item - The board item data from monday.com
 * @returns {string} CSS color value
 */
export const getItemColor = (item) => {
  const groupColor = item?.originalItem?.group?.color;
  return groupColor || 'var(--primary-color)';
};

/**
 * Extract group color from item structure
 * @param {Object} item - The board item data from monday.com
 * @returns {string|undefined} Group color or undefined if not available
 */
export const getGroupColor = (item) => {
  return item?.originalItem?.group?.color;
};

/**
 * Check if item has a custom group color
 * @param {Object} item - The board item data from monday.com
 * @returns {boolean} True if item has a custom group color
 */
export const hasCustomColor = (item) => {
  return Boolean(item?.originalItem?.group?.color);
};
