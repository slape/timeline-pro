import { useMemo } from 'react';
import TimelineLogger from '../utils/logger';

/**
 * Custom hook to calculate dynamic timeline start/end dates based on visible items
 * Adjusts the timeline range when items are hidden to prevent empty space at edges
 * @param {Array} visibleTimelineItems - Array of visible timeline items
 * @param {Date} originalStartDate - Original timeline start date
 * @param {Date} originalEndDate - Original timeline end date
 * @returns {Object} Object containing adjusted startDate and endDate
 */
export const useDynamicTimelineDates = (visibleTimelineItems, originalStartDate, originalEndDate) => {
  return useMemo(() => {
    // If no visible items or no original dates, return original dates
    if (!visibleTimelineItems || visibleTimelineItems.length === 0 || !originalStartDate || !originalEndDate) {
      TimelineLogger.debug('useDynamicTimelineDates: Using original dates (no visible items or original dates)', {
        visibleItemCount: visibleTimelineItems?.length || 0,
        hasOriginalStartDate: !!originalStartDate,
        hasOriginalEndDate: !!originalEndDate
      });
      return {
        startDate: originalStartDate,
        endDate: originalEndDate,
        isAdjusted: false
      };
    }

    // Extract valid dates from visible items
    const visibleDates = visibleTimelineItems
      .map(item => item.date)
      .filter(date => date && !isNaN(new Date(date)))
      .map(date => new Date(date));

    if (visibleDates.length === 0) {
      TimelineLogger.debug('useDynamicTimelineDates: No valid dates in visible items, using original dates');
      return {
        startDate: originalStartDate,
        endDate: originalEndDate,
        isAdjusted: false
      };
    }

    // Find min and max dates from visible items
    const minVisibleDate = new Date(Math.min(...visibleDates));
    const maxVisibleDate = new Date(Math.max(...visibleDates));

    // Calculate 3-day padding (same as original implementation)
    const paddingInMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    const adjustedStartDate = new Date(minVisibleDate.getTime() - paddingInMs);
    const adjustedEndDate = new Date(maxVisibleDate.getTime() + paddingInMs);

    // Check if adjustment is needed (if the adjusted range is significantly different from original)
    const originalRange = originalEndDate.getTime() - originalStartDate.getTime();
    const adjustedRange = adjustedEndDate.getTime() - adjustedStartDate.getTime();
    const rangeDifference = Math.abs(originalRange - adjustedRange) / originalRange;
    
    // Only adjust if the range difference is significant (more than 10%) or if the visible range
    // is much smaller than the original range (indicating hidden edge items)
    const shouldAdjust = rangeDifference > 0.1 || 
                        (adjustedStartDate > originalStartDate || adjustedEndDate < originalEndDate);

    if (shouldAdjust) {
      TimelineLogger.debug('useDynamicTimelineDates: Adjusting timeline dates based on visible items', {
        originalStart: originalStartDate.toISOString(),
        originalEnd: originalEndDate.toISOString(),
        adjustedStart: adjustedStartDate.toISOString(),
        adjustedEnd: adjustedEndDate.toISOString(),
        visibleItemCount: visibleTimelineItems.length,
        visibleDateRange: {
          min: minVisibleDate.toISOString(),
          max: maxVisibleDate.toISOString()
        },
        rangeDifference: Math.round(rangeDifference * 100) + '%'
      });

      return {
        startDate: adjustedStartDate,
        endDate: adjustedEndDate,
        isAdjusted: true
      };
    }

    TimelineLogger.debug('useDynamicTimelineDates: No adjustment needed, using original dates', {
      rangeDifference: Math.round(rangeDifference * 100) + '%',
      visibleItemCount: visibleTimelineItems.length
    });

    return {
      startDate: originalStartDate,
      endDate: originalEndDate,
      isAdjusted: false
    };
  }, [visibleTimelineItems, originalStartDate, originalEndDate]);
};
