import { determineTimelineScale, calculateItemPosition } from "./timelineUtils";
import { getItemsWithDates } from "./getItemsWithDates";
import TimelineLogger from "../utils/logger";

/**
 * Processes board items to extract timeline data and parameters
 * @param {Array} boardItems - Array of board items from monday.com
 * @param {Object} settings - Settings object containing date column configuration
 * @returns {Object|null} Object containing timelineParams and timelineItems, or null if processing fails
 */
export function processTimelineData(boardItems, settings, dateColumnId) {
  const startTime = Date.now();
  const { scale } = settings;

  if (!boardItems || boardItems.length === 0) {
    TimelineLogger.debug("processTimelineData: No board items available");
    return null;
  }

  if (!dateColumnId) {
    TimelineLogger.warn(
      "processTimelineData: No date column selected in settings",
      {
        settingsKeys: Object.keys(settings || {}),
        hasDateSetting: !!(settings && settings.dateColumnId),
      },
    );
    return null;
  }

  try {
    // Find the date column ID - handle both regular date and timeline/timeline range fields
    let isTimelineField = false;
    if (dateColumnId) {
      if (
        dateColumnId.toLowerCase().includes("timeline") ||
        dateColumnId.toLowerCase().includes("timerange")
      ) {
        isTimelineField = true;
      }
    }

    TimelineLogger.debug("processTimelineData: Date column found", {
      dateColumnId,
      isTimelineField,
    });

    if (!dateColumnId) {
      TimelineLogger.warn(
        "processTimelineData: No date column selected in settings",
        {
          settingsKeys: Object.keys(settings || {}),
          hasDateSetting: !!(settings && settings.dateColumnId),
        },
      );
      return null;
    }

    TimelineLogger.debug("processTimelineData: Processing with date column", {
      dateColumnId,
      isTimelineField,
      fieldType: isTimelineField ? "timeline/timerange" : "regular_date",
    });

    // Extract dates from board items using the imported function
    const itemsWithDates = getItemsWithDates(
      boardItems,
      dateColumnId,
      isTimelineField,
    );

    if (itemsWithDates.length === 0) {
      TimelineLogger.warn(
        "processTimelineData: No valid dates found in board items",
        {
          boardItemCount: boardItems.length,
          dateColumnId,
        },
      );
      return null;
    }

    TimelineLogger.debug("processTimelineData: Items with dates extracted", {
      inputCount: boardItems.length,
      outputCount: itemsWithDates.length,
      dateColumnId,
    });

    // Find min and max dates
    const dates = itemsWithDates
      .map((item) => item.date)
      .filter((date) => date && !isNaN(new Date(date)));
    if (dates.length === 0) return null;
    const minDate = new Date(Math.min(...dates.map((d) => new Date(d))));
    const maxDate = new Date(Math.max(...dates.map((d) => new Date(d))));

    TimelineLogger.debug("processTimelineData: Date range calculated", {
      minDate: minDate.toISOString(),
      maxDate: maxDate.toISOString(),
      dateRangeDays: Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)),
    });

    // Add padding to the timeline to prevent items from falling off the display area
    const timeRange = maxDate - minDate;

    // Use percentage-based padding with a minimum of 3 days on each side
    const percentagePadding = timeRange * 0.15; // Increased from 10% to 15%
    const minimumPaddingInMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

    // Use the larger of percentage padding or minimum padding
    const padding = Math.max(percentagePadding, minimumPaddingInMs);

    const startDate = new Date(minDate.getTime() - padding);
    const endDate = new Date(maxDate.getTime() + padding);

    // Determine appropriate scale
    const timelineScale = determineTimelineScale(startDate, endDate, scale);

    // Create timeline parameters
    const timelineParams = {
      startDate,
      endDate,
      timelineScale: timelineScale,
    };

    // Create timeline items with positions
    const timelineItems = itemsWithDates.map((item) => {
      // Add parsed date to the original item for use in DraggableBoardItem
      const originalItemWithDate = {
        ...item.originalItem,
        parsedDate: item.date,
      };

      return {
        id: item.id,
        label: item.label,
        date: item.date,
        position: calculateItemPosition(item.date, startDate, endDate),
        originalItem: originalItemWithDate,
      };
    });

    const duration = Date.now() - startTime;
    TimelineLogger.performance("processTimelineData.complete", duration, {
      inputCount: boardItems.length,
      outputCount: itemsWithDates.length,
      scale,
      dateRangeDays: Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)),
    });

    return { timelineItems, timelineParams };
  } catch (error) {
    TimelineLogger.error("processTimelineData.failed", error, {
      boardItemCount: boardItems.length,
      hasSettings: !!settings,
      scale,
    });
    return null;
  }
}
