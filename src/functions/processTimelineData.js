import { determineTimelineScale, calculateItemPosition } from './timelineUtils';
import { getItemsWithDates } from './getItemsWithDates';
import TimelineLogger from '../utils/logger';

/**
 * Processes board items to extract timeline data and parameters
 * @param {Array} boardItems - Array of board items from monday.com
 * @param {Object} settings - Settings object containing date column configuration
 * @param {string} scale - Timeline scale setting
 * @returns {Object|null} Object containing timelineParams and timelineItems, or null if processing fails
 */
export function processTimelineData(boardItems, settings, scale) {
  const startTime = Date.now();
  
  if (!boardItems || boardItems.length === 0) {
    TimelineLogger.debug('processTimelineData: No board items available');
    return null;
  }

  try {
    // Find the date column ID - handle both regular date and timeline/timeline range fields
    let dateColumn = null;
    let isTimelineField = false;
    
    if (settings.date) {
      const dateKeys = Object.keys(settings.date);
      for (const key of dateKeys) {
        if (settings.date[key] === true) {
          // Check if this is a timeline field (contains 'timeline' or 'timerange')
          if (key.toLowerCase().includes('timeline') || key.toLowerCase().includes('timerange')) {
            dateColumn = key;
            isTimelineField = true;
            break;
          } else {
            // Regular date field
            dateColumn = key;
            isTimelineField = false;
            break;
          }
        }
      }
    }

    if (!dateColumn) {
      TimelineLogger.warn('processTimelineData: No date column selected in settings', {
        settingsKeys: Object.keys(settings || {}),
        hasDateSetting: !!(settings && settings.date)
      });
      return null;
    }
    
    TimelineLogger.debug('processTimelineData: Processing with date column', { 
      dateColumn, 
      isTimelineField,
      fieldType: isTimelineField ? 'timeline/timerange' : 'regular_date' 
    });
    
    // Extract dates from board items using the imported function
    const itemsWithDates = getItemsWithDates(boardItems, dateColumn, isTimelineField);
    
    if (itemsWithDates.length === 0) {
      TimelineLogger.warn('processTimelineData: No valid dates found in board items', {
        boardItemCount: boardItems.length,
        dateColumn
      });
      return null;
    }
    
    TimelineLogger.debug('processTimelineData: Items with dates extracted', {
      inputCount: boardItems.length,
      outputCount: itemsWithDates.length,
      dateColumn
    });
    
    // Find min and max dates
    const dates = itemsWithDates.map(item => item.date);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    TimelineLogger.debug('processTimelineData: Date range calculated', {
      minDate: minDate.toISOString(),
      maxDate: maxDate.toISOString(),
      dateRangeDays: Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24))
    });
    
    // Add padding to the timeline to prevent items from falling off the display area
    const timeRange = maxDate - minDate;
    const timeRangeInDays = timeRange / (1000 * 60 * 60 * 24);
    
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
      scale: timelineScale
    };
    
    // Create timeline items with positions
    const timelineItems = itemsWithDates.map(item => {
      // Add parsed date to the original item for use in DraggableBoardItem
      const originalItemWithDate = {
        ...item.originalItem,
        parsedDate: item.date
      };
      
      return {
        id: item.id,
        label: item.label,
        date: item.date,
        position: calculateItemPosition(item.date, startDate, endDate),
        originalItem: originalItemWithDate
      };
    });
    
    const result = {
      timelineParams,
      timelineItems
    };
    
    const duration = Date.now() - startTime;
    TimelineLogger.performance('processTimelineData.complete', duration, {
      inputCount: boardItems.length,
      outputCount: timelineItems.length,
      timelineScale,
      dateRangeDays: Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24))
    });
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    TimelineLogger.error('processTimelineData.failed', error, {
      boardItemCount: boardItems.length,
      hasSettings: !!settings,
      scale
    });
    return null;
  }
}
