import generateTimelineMarkers from "./generateTimelineMarkers";
import TimelineLogger from "../utils/logger";

/**
 * Generates timeline markers with comprehensive logging and error handling
 *
 * @param {Array} visibleBoardItems - Array of visible board items
 * @param {Object|string} dateColumn - Date column configuration
 * @param {Date} startDate - Start date for timeline
 * @param {Date} endDate - End date for timeline
 * @param {string} dateFormat - Date format string
 * @returns {Array} Generated timeline markers
 */
const generateTimelineMarkersWithLogging = (
  visibleBoardItems,
  dateColumn,
  startDate,
  endDate,
  dateFormat,
) => {
  TimelineLogger.debug("Timeline: Generating markers", {
    boardItemCount: visibleBoardItems?.length || 0,
    dateColumn,
    visibleItemCount: visibleBoardItems?.length || 0,
  });

  const startTime = Date.now();
  let generatedMarkers = [];

  // Generate markers (function handles empty board items by returning start/end markers)
  try {
    TimelineLogger.debug("[Timeline] Calling generateTimelineMarkers", {
      visibleItemsCount: (visibleBoardItems || []).length,
      dateColumnId:
        typeof dateColumn === "object" ? dateColumn?.id : dateColumn,
      hasDateColumn: !!dateColumn,
      startDate,
      endDate,
      dateFormat,
    });

    generatedMarkers = generateTimelineMarkers(
      visibleBoardItems,
      dateColumn,
      startDate,
      endDate,
      dateFormat,
    );

    TimelineLogger.debug("[Timeline] Markers generated", {
      count: generatedMarkers?.length || 0,
      markers: generatedMarkers,
    });
  } catch (e) {
    TimelineLogger.error("[Timeline] generateTimelineMarkers threw", e, {
      visibleBoardItemsCount: (visibleBoardItems || []).length,
      dateColumn,
    });
  }

  const duration = Date.now() - startTime;
  TimelineLogger.performance("generateTimelineMarkers", duration, {
    markerCount: generatedMarkers?.length || 0,
    visibleBoardItemCount: visibleBoardItems?.length || 0,
  });

  return generatedMarkers;
};

export default generateTimelineMarkersWithLogging;
