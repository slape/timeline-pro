import { DRAGGABLE_ITEM } from "../utils/configConstants";
import TimelineLogger from "../utils/logger";

/**
 * Generates default positions for items when position setting changes
 * This ensures items are placed within bounds and distributed nicely
 *
 * @param {Array} items - Array of timeline items
 * @param {string} position - New position setting ('above', 'below', 'alternate')
 * @returns {Object} Default positions { itemId: { x, y } }
 */
export function generateDefaultPositions(items, position) {
  if (!items || items.length === 0) {
    return {};
  }

  TimelineLogger.debug(
    "Generating default positions for position setting change",
    {
      position,
      itemCount: items.length,
    },
  );

  const defaultPositions = {};

  items.forEach((item, index) => {
    // Keep X position unchanged (items stay at their timeline date position)
    // Only reset Y position to sensible defaults within bounds

    let defaultY;

    switch (position) {
      case "above":
        // Alternate between upward and downward positions for visual distribution
        defaultY =
          index % 2 === 0
            ? DRAGGABLE_ITEM.ABOVE_DEFAULT_Y_UP // -80px (upward)
            : DRAGGABLE_ITEM.ABOVE_DEFAULT_Y_DOWN; // 60px (downward)
        break;

      case "below":
        // Alternate between upward and downward positions for visual distribution
        defaultY =
          index % 2 === 0
            ? DRAGGABLE_ITEM.BELOW_DEFAULT_Y_UP // -60px (upward)
            : DRAGGABLE_ITEM.BELOW_DEFAULT_Y_DOWN; // 80px (downward)
        break;

      case "alternate":
        // Alternate between upward and downward positions (this is the main feature of alternate mode)
        defaultY =
          index % 2 === 0
            ? DRAGGABLE_ITEM.ALTERNATE_DEFAULT_Y_UP // -40px (upward)
            : DRAGGABLE_ITEM.ALTERNATE_DEFAULT_Y_DOWN; // 40px (downward)
        break;

      default:
        // For 'center' or unknown positions, use moderate defaults
        defaultY = index % 2 === 0 ? -50 : 50;
        break;
    }

    // Store default position (X will be determined by item's date position)
    defaultPositions[item.id] = {
      x: null, // Will be calculated from item's date when rendered
      y: defaultY,
    };
  });

  TimelineLogger.debug("Default positions generated", {
    position,
    generatedCount: Object.keys(defaultPositions).length,
    samplePositions: Object.entries(defaultPositions)
      .slice(0, 3)
      .map(([id, pos]) => ({ id, y: pos.y })),
  });

  return defaultPositions;
}

/**
 * Applies default positions to items that are outside the new bounds
 * This is used when position setting changes to ensure all items remain accessible
 *
 * @param {Object} customPositions - Current custom positions { itemId: { x, y } }
 * @param {Array} items - Array of timeline items
 * @param {string} newPosition - New position setting
 * @returns {Object} Updated positions with defaults applied where needed
 */
export function applyDefaultsForOutOfBoundsItems(
  customPositions,
  items,
  newPosition,
) {
  if (!customPositions || !items || items.length === 0) {
    return generateDefaultPositions(items, newPosition);
  }

  // Get bounds for the new position setting
  let minY, maxY;

  switch (newPosition) {
    case "above":
      minY = -DRAGGABLE_ITEM.ABOVE_MAX_DISTANCE_UP;
      maxY = DRAGGABLE_ITEM.ABOVE_MAX_DISTANCE_DOWN;
      break;
    case "below":
      minY = -DRAGGABLE_ITEM.BELOW_MAX_DISTANCE_UP;
      maxY = DRAGGABLE_ITEM.BELOW_MAX_DISTANCE_DOWN;
      break;
    case "alternate":
      minY = -DRAGGABLE_ITEM.ALTERNATE_MAX_DISTANCE_UP;
      maxY = DRAGGABLE_ITEM.ALTERNATE_MAX_DISTANCE_DOWN;
      break;
    default:
      minY = -200;
      maxY = 200;
      break;
  }

  const updatedPositions = { ...customPositions };
  const defaultPositions = generateDefaultPositions(items, newPosition);
  let resetCount = 0;

  // Check each item's position against new bounds
  items.forEach((item) => {
    const currentPos = customPositions[item.id];

    if (currentPos && (currentPos.y < minY || currentPos.y > maxY)) {
      // Item is out of bounds, apply default position
      updatedPositions[item.id] = {
        x: currentPos.x, // Keep X position
        y: defaultPositions[item.id].y, // Use default Y position
      };
      resetCount++;
    }
  });

  TimelineLogger.debug("Applied defaults for out-of-bounds items", {
    newPosition,
    totalItems: items.length,
    resetCount,
    bounds: { minY, maxY },
  });

  return updatedPositions;
}

export default generateDefaultPositions;
