import { useMemo } from "react";
import calculateScaleMarkersWithLogging from "../functions/calculateScaleMarkersWithLogging";
import TimelineLogger from "../utils/logger";

/**
 * Custom hook to calculate dynamic scale markers based on effective timeline dates
 * @param {Date} effectiveStartDate - Effective timeline start date (may be adjusted)
 * @param {Date} effectiveEndDate - Effective timeline end date (may be adjusted)
 * @param {string} scale - Timeline scale setting
 * @param {boolean} isAdjusted - Whether the dates have been adjusted from original
 * @returns {Array} Array of scale markers
 */
export const useDynamicScaleMarkers = (
  effectiveStartDate,
  effectiveEndDate,
  scale,
  isAdjusted,
) => {
  return useMemo(() => {
    if (!effectiveStartDate || !effectiveEndDate || scale === "none") {
      return [];
    }

    const markers = calculateScaleMarkersWithLogging(
      effectiveStartDate,
      effectiveEndDate,
      scale,
    );

    if (isAdjusted) {
      TimelineLogger.debug(
        "Scale markers recalculated for adjusted timeline dates",
        {
          effectiveStart: effectiveStartDate.toISOString(),
          effectiveEnd: effectiveEndDate.toISOString(),
          scale,
          markerCount: markers.length,
        },
      );
    }

    return markers;
  }, [effectiveStartDate, effectiveEndDate, scale, isAdjusted]);
};
