import processBoardItemsWithMarkers from "./processBoardItemsWithMarkers";
import TimelineLogger from "../utils/logger";

/**
 * Builds a mapping between timeline items and their closest markers
 *
 * @param {Object} params - Parameters object
 * @param {Array} params.visibleBoardItems - Array of visible board items
 * @param {Array} params.visibleTimelineItems - Array of visible timeline items
 * @param {Object} params.dateColumn - Date column configuration
 * @param {Date} params.startDate - Timeline start date
 * @param {Date} params.endDate - Timeline end date
 * @param {string} params.position - Timeline position setting
 * @param {Array} params.markers - Array of timeline markers
 *
 * @returns {Object} Result object with processedBoardItems and itemToMarkerMap
 */
export default function buildItemToMarkerMap({
  visibleBoardItems,
  visibleTimelineItems,
  dateColumn,
  startDate,
  endDate,
  position,
  markers,
}) {
  TimelineLogger.debug("[buildItemToMarkerMap] Building item→marker map", {
    visibleBoardItemsCount: visibleBoardItems?.length || 0,
    visibleTimelineItemsCount: visibleTimelineItems?.length || 0,
    markersCount: markers?.length || 0,
  });

  // If we have raw board items and a date column, use the existing processor
  if (visibleBoardItems && visibleBoardItems.length > 0 && dateColumn) {
    const result = processBoardItemsWithMarkers(
      visibleBoardItems,
      dateColumn,
      startDate,
      endDate,
      position,
      markers,
    );

    TimelineLogger.debug(
      "[buildItemToMarkerMap] Map built via visibleBoardItems processor",
      {
        mapped: result.itemToMarkerMap?.size || 0,
      },
    );

    return {
      processedBoardItems: result.processedBoardItems,
      itemToMarkerMap: result.itemToMarkerMap,
    };
  }

  // Fallback: derive mapping directly from current timeline items and markers
  const map = new Map();
  (visibleTimelineItems || []).forEach((item) => {
    if (!item?.date || !(item.date instanceof Date) || isNaN(item.date)) return;

    // Compute timeline position percentage for the item's date
    const timeRange = endDate - startDate;
    if (!timeRange || timeRange <= 0) return;
    const positionPct = ((item.date - startDate) / timeRange) * 100;

    // Find the closest marker by position
    let closestMarker = null;
    let minDistance = Infinity;

    markers.forEach((marker, index) => {
      const distance = Math.abs(marker.position - positionPct);
      if (distance < minDistance) {
        minDistance = distance;
        closestMarker = { marker, index };
      }
    });

    if (closestMarker) {
      map.set(String(item.id), {
        markerId: `timeline-marker-${closestMarker.index}`,
        markerIndex: closestMarker.index,
        markerPosition: closestMarker.marker.position,
      });
    }
  });

  TimelineLogger.debug("[buildItemToMarkerMap] Map built via fallback", {
    mapped: map.size,
  });

  return {
    processedBoardItems: null, // No processed items in fallback mode
    itemToMarkerMap: map,
  };
}
