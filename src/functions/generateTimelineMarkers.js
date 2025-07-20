import getUniqueDates from './getUniqueDates';
import formatDate from './formatDate';
import { calculateItemPosition } from './timelineUtils';

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
  if (boardItems.length > 0 && dateColumn) {
    // Get unique dates from board items
    const uniqueDates = getUniqueDates(boardItems, dateColumn);
    
    if (uniqueDates.length > 0) {
      // Find the actual date range from the board items
      const actualStartDate = new Date(Math.min(...uniqueDates.map(d => d.getTime())));
      const actualEndDate = new Date(Math.max(...uniqueDates.map(d => d.getTime())));
      
      // Use the actual date range from board items, or fall back to provided start/end dates
      const timelineStart = actualStartDate < startDate ? actualStartDate : startDate;
      const timelineEnd = actualEndDate > endDate ? actualEndDate : endDate;
      
      // Create markers for each unique date using the expanded timeline range
      const dateMarkers = uniqueDates.map(date => ({
        date,
        label: formatDate(date, dateFormat),
        position: calculateItemPosition(date, timelineStart, timelineEnd)
      }));
      
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
      return sortedMarkers;
    } else {
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
