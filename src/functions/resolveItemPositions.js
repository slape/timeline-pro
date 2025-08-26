import { getDefaultRowFor } from "./getDefaultRowFor";
import { clamp } from "./clamp";
import {
  LANE_HEIGHT,
  OFFSET_MAX,
  MIN_ROW,
  MAX_ROW,
} from "../utils/configConstants";
import TimelineLogger from "../utils/logger";

/**
 * Resolves item positions using the Row/Lane Shift model
 * @param {Array} items - Array of timeline items
 * @param {string} positionSetting - Position setting ('above', 'below', 'alternate')
 * @param {Object} customItemY - Object mapping itemId to { rowShift, laneOffset }
 * @returns {Array} Array of items with resolved render positions
 */
export function resolveItemPositions({ items, positionSetting, customItemY }) {
  return items.map((item) => {
    const baseRow = getDefaultRowFor(item, positionSetting);
    const override = customItemY[item.id] || { rowShift: 0, laneOffset: 0 };

    const row = clamp(baseRow + (override.rowShift || 0), MIN_ROW, MAX_ROW);
    const laneOffset = clamp(override.laneOffset || 0, -OFFSET_MAX, OFFSET_MAX);
    const finalY = row * LANE_HEIGHT + laneOffset;

    // Log the position data for debugging
    TimelineLogger.debug("[POS] Resolved item position", {
      itemId: item.id,
      originalX: item.renderPosition?.x,
      originalY: item.renderPosition?.y,
      finalY,
      baseRow,
      row,
      laneOffset,
      hasCustomY: !!customItemY[item.id],
    });

    return {
      ...item,
      finalY,
      renderPosition: {
        // Preserve existing renderPosition values if they exist
        ...(item.renderPosition || {}),
        // Override or set y position based on row/lane calculation
        y: finalY,
        // Preserve the original x position if it exists
        // This is critical for proper timeline placement
        x: item.renderPosition?.x !== undefined ? item.renderPosition.x : 50,
        // Ensure a default zIndex if not set
        zIndex: item.renderPosition?.zIndex ?? 10,
      },
      // Store the original y position for connector alignment
      connectorY: item.originalY !== undefined ? item.originalY : finalY,
      isCustomPosition: !!customItemY[item.id],
    };
  });
}
