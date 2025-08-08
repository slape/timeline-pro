import formatDate from './formatDate';
import { calculateItemPosition } from './timelineUtils';
import TimelineLogger from '../utils/logger';

/**
 * Generates timeline markers based on board items, date column, and date range
 * 
 * @param {Array} boardItems - Array of board items from monday.com
 * @param {string} dateColumn - The ID of the column containing date values
 * @param {Date} startDate - Start date of the timeline
 * @param {Date} endDate - End date of the timeline
 * @param {string} dateFormat - Format for displaying dates
 * @returns {Array} Array of timeline markers with date, label, and position
 */
const generateTimelineMarkers = (boardItems, dateColumn, startDate, endDate, dateFormat) => {
  // Normalize date column id: can be a string id or an object (e.g., {id})
  const dateColumnId = typeof dateColumn === 'object'
    ? (dateColumn?.id || dateColumn?.value || (Object.keys(dateColumn || {})[0]))
    : dateColumn;
  TimelineLogger.debug('[Markers] Input', {
    boardItemsCount: boardItems?.length || 0,
    hasDateColumn: !!dateColumnId,
    dateColumnRaw: dateColumn,
    dateColumnId,
    startDate,
    endDate,
    dateFormat
  });
  if (boardItems.length > 0 && dateColumnId) {
    // Enhanced field detection - automatically detect field type from data structure
    const dates = new Set();
    
    boardItems.forEach(item => {
      const column = item.column_values?.find(col => col.id === dateColumnId);
      
      if (column?.value) {
        try {
          const columnValue = JSON.parse(column.value);
          let dateStr = null;
          
          // Check if this is a timeline/range field by looking at the data structure
          const hasTimelineFields = columnValue.to || columnValue.end || columnValue.from;
          const hasStandardDate = columnValue.date;
          
          // Determine which type of field this is based on available data
          if (hasTimelineFields) {
            // Timeline/range field - use the end date
            if (columnValue.to) {
              dateStr = columnValue.to;
            } else if (columnValue.end) {
              dateStr = columnValue.end;
            } else if (columnValue.from) {
              dateStr = columnValue.from;
            }
          } else if (hasStandardDate) {
            // Standard date field
            dateStr = columnValue.date;
          }
          
          if (dateStr) {
            // Normalize to consistent format (YYYY-MM-DD)
            const [year, month, day] = dateStr.split('-').map(Number);
            const normalizedDate = new Date(year, month - 1, day, 12, 0, 0);
            
            if (normalizedDate instanceof Date && !isNaN(normalizedDate)) {
              // Use ISO string to ensure uniqueness (removes time differences)
              dates.add(normalizedDate.toISOString().split('T')[0]);
            }
          }
        } catch (error) {
          TimelineLogger.error('[Markers] Error parsing date value', { error, column: column?.value, itemId: item?.id });
        }
      }
    });
    TimelineLogger.debug('[Markers] Unique date strings found', { count: dates.size, values: Array.from(dates) });
    
    // Convert Set back to array of Date objects and sort chronologically
    const uniqueDates = Array.from(dates)
      .map(dateString => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
      })
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (uniqueDates.length > 0) {
      // Create date-only versions to avoid timezone issues when comparing
      const toDateOnly = (date) => {
        // Validate the date
        if (!date || isNaN(new Date(date).getTime())) {
          console.warn('Invalid date provided to toDateOnly:', date);
          return null;
        }
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      };
      
      // Find the actual date range from the board items using date-only comparison
      const actualStartDate = toDateOnly(new Date(Math.min(...uniqueDates.map(d => d.getTime()))));
      const actualEndDate = toDateOnly(new Date(Math.max(...uniqueDates.map(d => d.getTime()))));
      
      // Use the actual date range from board items, or fall back to provided start/end dates
      const timelineStart = actualStartDate < startDate ? actualStartDate : startDate;
      const timelineEnd = actualEndDate > endDate ? actualEndDate : endDate;
      
      // Create markers for each unique date using the expanded timeline range
      const dateMarkers = uniqueDates.map(date => {
        // Use date-only for consistent positioning
        const dateOnly = toDateOnly(date);
        return {
          date: dateOnly,
          label: formatDate(dateOnly, dateFormat),
          position: calculateItemPosition(dateOnly, timelineStart, timelineEnd)
        };
      });
      
      // Add start and end markers only if they're not already covered by the data
      const allMarkers = [...dateMarkers];
      
      // Add start marker if it's different from the earliest data date
      if (timelineStart.getTime() !== actualStartDate.getTime()) {
        allMarkers.push({
          date: timelineStart,
          label: formatDate(timelineStart, dateFormat),
          position: 0
        });
      }
      
      // Add end marker if it's different from the latest data date
      if (timelineEnd.getTime() !== actualEndDate.getTime()) {
        allMarkers.push({
          date: timelineEnd,
          label: formatDate(timelineEnd, dateFormat),
          position: 100
        });
      }
      
      // Remove duplicates and sort by position
      const uniqueMarkers = allMarkers.filter((marker, index, self) => 
        index === self.findIndex(m => Math.abs(m.position - marker.position) < 0.1)
      );
      
      const sortedMarkers = uniqueMarkers.sort((a, b) => a.position - b.position);
      TimelineLogger.debug('[Markers] Generated from board items', { count: sortedMarkers.length, markers: sortedMarkers });
      return sortedMarkers;
    } else {
      TimelineLogger.warn('[Markers] No dates found, using default markers');
      // No dates found in board items, use default markers
      return [
        {
          date: startDate,
          label: formatDate(startDate, dateFormat),
          position: 0
        },
        {
          date: endDate,
          label: formatDate(endDate, dateFormat),
          position: 100
        }
      ];
    }
  } else {
    TimelineLogger.warn('[Markers] No board items or date column, using fallback markers', { boardItemsCount: boardItems?.length || 0, hasDateColumn: !!dateColumn });
    // Fallback to default start/end markers if no board items or date column
    return [
      {
        date: startDate,
        label: formatDate(startDate, dateFormat),
        position: 0
      },
      {
        date: endDate,
        label: formatDate(endDate, dateFormat),
        position: 100
      }
    ];
  }
};

export default generateTimelineMarkers;
