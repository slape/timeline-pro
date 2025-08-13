import { calculateTimelineItemPositions } from './calculateTimelineItemPositions';
import TimelineLogger from '../utils/logger';

/**
 * Resolves item positions by merging default calculated positions with custom user positions
 * This function handles the integration between the automatic positioning system and user customizations
 * 
 * @param {Array} items - Array of timeline items with dates
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {string} position - Position setting ('above', 'below', 'alternate')
 * @param {Object} customPositions - Custom user positions { itemId: { x, y } }
 * @returns {Array} Array of items with resolved render positions
 */
export function resolveItemPositions(items, startDate, endDate, position, customPositions = {}) {
  if (!items || items.length === 0) {
    TimelineLogger.debug('resolveItemPositions: No items provided');
    return [];
  }

  if (!startDate || !endDate) {
    TimelineLogger.warn('resolveItemPositions: Missing start or end date');
    return [];
  }

  TimelineLogger.debug('resolveItemPositions: Starting position resolution', {
    itemCount: items.length,
    position,
    customPositionCount: Object.keys(customPositions).length,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  // Step 1: Calculate default positions using existing algorithm
  const itemsWithDefaultPositions = calculateTimelineItemPositions(items, startDate, endDate, position);
  
  TimelineLogger.debug('resolveItemPositions: Default positions calculated', {
    itemsWithPositions: itemsWithDefaultPositions.length
  });

  // Step 2: Override with custom positions where they exist
  const resolvedItems = itemsWithDefaultPositions.map(item => {
    const customPosition = customPositions[item.id];
    
    if (customPosition) {
      // Use custom position, but preserve other render position properties
      const resolvedPosition = {
        ...item.renderPosition,
        x: customPosition.x,
        y: customPosition.y,
        isCustom: true // Mark as custom for debugging/UI purposes
      };
      
      TimelineLogger.debug('resolveItemPositions: Applied custom position', {
        itemId: item.id,
        defaultPosition: { x: item.renderPosition.x, y: item.renderPosition.y },
        customPosition: { x: customPosition.x, y: customPosition.y }
      });
      
      return {
        ...item,
        renderPosition: resolvedPosition
      };
    } else {
      // Use default position, mark as default
      return {
        ...item,
        renderPosition: {
          ...item.renderPosition,
          isCustom: false
        }
      };
    }
  });

  TimelineLogger.debug('resolveItemPositions: Position resolution complete', {
    totalItems: resolvedItems.length,
    customPositionedItems: resolvedItems.filter(item => item.renderPosition.isCustom).length,
    defaultPositionedItems: resolvedItems.filter(item => !item.renderPosition.isCustom).length
  });

  return resolvedItems;
}

/**
 * Validates if custom positions are compatible with the current position setting
 * This helps determine if positions should be reset or mirrored when settings change
 * 
 * @param {Object} customPositions - Custom user positions { itemId: { x, y } }
 * @param {string} currentSetting - Current position setting
 * @param {string} newSetting - New position setting
 * @returns {Object} Validation result with recommendations
 */
export function validatePositionCompatibility(customPositions, currentSetting, newSetting) {
  if (!customPositions || Object.keys(customPositions).length === 0) {
    return {
      isCompatible: true,
      action: 'none',
      reason: 'No custom positions to validate'
    };
  }

  if (currentSetting === newSetting) {
    return {
      isCompatible: true,
      action: 'none',
      reason: 'Position setting unchanged'
    };
  }

  // Check if this is a simple above/below flip
  const isAboveBelowFlip = 
    (currentSetting === 'above' && newSetting === 'below') ||
    (currentSetting === 'below' && newSetting === 'above');

  if (isAboveBelowFlip) {
    return {
      isCompatible: true,
      action: 'mirror',
      reason: 'Above/below flip can be mirrored by inverting Y coordinates'
    };
  }

  // For other changes (to/from alternate, or other combinations), reset is safer
  return {
    isCompatible: false,
    action: 'reset',
    reason: `Position setting change from ${currentSetting} to ${newSetting} requires position reset`
  };
}

/**
 * Applies position bounds to ensure items stay within the timeline container
 * This function can be used to validate and constrain both default and custom positions
 * 
 * @param {Object} position - Position object { x, y }
 * @param {Object} bounds - Bounds object { minX, maxX, minY, maxY }
 * @returns {Object} Bounded position object
 */
export function applyPositionBounds(position, bounds) {
  if (!position || !bounds) {
    return position;
  }

  const boundedPosition = {
    x: Math.max(bounds.minX || 0, Math.min(position.x, bounds.maxX || 100)),
    y: Math.max(bounds.minY || -300, Math.min(position.y, bounds.maxY || 300))
  };

  // Log if position was adjusted
  if (boundedPosition.x !== position.x || boundedPosition.y !== position.y) {
    TimelineLogger.debug('applyPositionBounds: Position adjusted', {
      original: position,
      bounded: boundedPosition,
      bounds
    });
  }

  return boundedPosition;
}

/**
 * Converts render positions back to timeline coordinates for storage
 * This is useful when saving positions that need to be relative to timeline dates
 * 
 * @param {Array} items - Items with render positions
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @returns {Object} Storage-ready positions { itemId: { x, y } }
 */
export function convertRenderPositionsForStorage(items, startDate, endDate) {
  if (!items || !startDate || !endDate) {
    return {};
  }

  const storagePositions = {};
  
  items.forEach(item => {
    if (item.renderPosition && item.renderPosition.isCustom) {
      storagePositions[item.id] = {
        x: item.renderPosition.x,
        y: item.renderPosition.y
      };
    }
  });

  TimelineLogger.debug('convertRenderPositionsForStorage: Converted positions', {
    itemCount: Object.keys(storagePositions).length
  });

  return storagePositions;
}
