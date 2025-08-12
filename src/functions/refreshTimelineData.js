import TimelineLogger from '../utils/logger';
import { processTimelineData } from './processTimelineData';

/**
 * Refreshes timeline data after date changes by re-processing board items
 * and updating the zustand store with new timeline items and parameters
 * 
 * @param {Array} boardItems - Current board items from the store
 * @param {Object} settings - Timeline settings from the store
 * @param {Function} setTimelineItems - Zustand setter for timeline items
 * @param {Function} setTimelineParams - Zustand setter for timeline parameters
 * @returns {Promise<boolean>} - Success status
 */
const refreshTimelineData = async (boardItems, settings, setTimelineItems, setTimelineParams) => {
  try {
    TimelineLogger.debug('Refreshing timeline data after date change', {
      boardItemsCount: boardItems?.length || 0,
      settings: settings,
      hasSetTimelineItems: typeof setTimelineItems === 'function',
      hasSetTimelineParams: typeof setTimelineParams === 'function'
    });

    if (!boardItems || !Array.isArray(boardItems)) {
      TimelineLogger.warn('Cannot refresh timeline data: invalid board items', {
        boardItems: boardItems,
        boardItemsType: typeof boardItems
      });
      return false;
    }

    if (!settings) {
      TimelineLogger.warn('Cannot refresh timeline data: settings not available', {
        settings: settings
      });
      return false;
    }

    if (typeof setTimelineItems !== 'function' || typeof setTimelineParams !== 'function') {
      TimelineLogger.error('Cannot refresh timeline data: setter functions not available', {
        setTimelineItemsType: typeof setTimelineItems,
        setTimelineParamsType: typeof setTimelineParams
      });
      return false;
    }

    // Extract date column ID from settings
    let dateColumnId;
    if (settings?.dateColumn) {
      if (typeof settings.dateColumn === 'string') {
        dateColumnId = settings.dateColumn;
      } else if (typeof settings.dateColumn === 'object') {
        // Handle object format like { date_column_id: true }
        const keys = Object.keys(settings.dateColumn);
        dateColumnId = keys.length === 1 ? keys[0] : undefined;
      }
    }

    if (!dateColumnId) {
      TimelineLogger.warn('Cannot refresh timeline data: date column not configured', {
        dateColumn: settings?.dateColumn,
        dateColumnType: typeof settings?.dateColumn
      });
      return false;
    }

    TimelineLogger.debug('Processing timeline data for refresh', {
      boardItemsCount: boardItems.length,
      dateColumnId: dateColumnId,
      settings: settings
    });

    // Re-process the timeline data with updated board items
    const result = processTimelineData(boardItems, settings, dateColumnId);

    if (result) {
      const { timelineItems, timelineParams } = result;
      
      TimelineLogger.debug('Timeline data processed successfully', {
        timelineItemsCount: timelineItems?.length || 0,
        timelineParams: timelineParams
      });

      // Update the zustand store with new timeline data
      setTimelineItems(timelineItems);
      setTimelineParams(timelineParams);

      TimelineLogger.debug('Timeline data refreshed successfully', {
        newTimelineItemsCount: timelineItems?.length || 0,
        newTimelineParams: timelineParams
      });

      return true;
    } else {
      TimelineLogger.warn('Timeline data processing returned no result', {
        result: result
      });
      return false;
    }

  } catch (error) {
    TimelineLogger.error('Failed to refresh timeline data', {
      error: error.message,
      stack: error.stack,
      boardItemsCount: boardItems?.length || 0,
      settings: settings
    });
    return false;
  }
};

export default refreshTimelineData;
