import { calculateTimelineItemPositions } from "./calculateTimelineItemPositions";
import TimelineLogger from "../utils/logger";

/**
 * Resolves item positions by merging default calculated positions with custom Y-Delta offsets
 * @param {Array} items - Array of timeline items with dates
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {string} position - Position setting ('above', 'below', 'alternate')
 * @param {Object} customItemYDelta - Object mapping itemId to Y-Delta values { itemId: number }
 * @returns {Array} Array of items with resolved render positions
 */
export function resolveItemPositions(
  items,
  startDate,
  endDate,
  position,
  customItemYDelta = {}
) {
  TimelineLogger.debug("[Y-DELTA] resolveItemPositions called", {
    itemCount: items?.length || 0,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    position,
    customYDeltaCount: Object.keys(customItemYDelta).length,
    customItemYDelta,
  });

  // First, calculate default positions for all items
  const itemsWithDefaultPositions = calculateTimelineItemPositions(
    items,
    startDate,
    endDate,
    position
  );

  TimelineLogger.debug("[Y-DELTA] Default positions calculated", {
    itemCount: itemsWithDefaultPositions.length,
  });

  // Then, apply custom Y-Delta offsets and clamp to bounds
  const MIN_Y = -300;
  const MAX_Y = 300;
  const itemsWithResolvedPositions = itemsWithDefaultPositions.map((item) => {
    const itemId = item.id;
    const defaultY = item.renderPosition.y;
    const yDelta = customItemYDelta[itemId] || 0;
    let finalY = defaultY + yDelta;
    // Clamp to bounds
    finalY = Math.max(MIN_Y, Math.min(MAX_Y, finalY));
    const isCustom = typeof customItemYDelta[itemId] === "number";
    TimelineLogger.debug("[Y-DELTA] Resolved item Y", {
      itemId,
      defaultY,
      yDelta,
      finalY,
      isCustom,
    });
    return {
      ...item,
      renderPosition: {
        ...item.renderPosition,
        y: finalY,
      },
      isCustomPosition: isCustom,
    };
  });

  TimelineLogger.debug("[Y-DELTA] Positions resolved", {
    totalItems: itemsWithResolvedPositions.length,
    customPositions: itemsWithResolvedPositions.filter(item => item.isCustomPosition).length,
    defaultPositions: itemsWithResolvedPositions.filter(item => !item.isCustomPosition).length,
  });

  return itemsWithResolvedPositions;
}
