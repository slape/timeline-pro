import { format } from 'date-fns';

/**
 * Get the next date based on scale
 * 
 * @param {Date} date - The date to advance from
 * @param {string} scale - The scale to use ('days', 'weeks', 'months', etc)
 * @returns {Date} The next date based on the scale
 */
function getNextScaleDate(date, scale) {
  const next = new Date(date);
  switch (scale) {
    case 'days':
      next.setDate(next.getDate() + 1);
      break;
    case 'weeks':
      next.setDate(next.getDate() + 7);
      break;
    case 'months':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarters':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'years':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Format scale marker labels
 * 
 * @param {Date} date - The date to format
 * @param {string} scale - The scale to use ('days', 'weeks', 'months', etc)
 * @param {string|number} index - The index or 'End' for the marker
 * @param {Date} startDateRef - The reference start date (needed for week calculations)
 * @returns {string} The formatted label
 */
function getScaleLabel(date, scale, index, startDateRef) {
  switch (scale) {
    case 'days':
      return format(date, 'MMM d');
    case 'weeks':
      // Calculate week number based on the start date
      if (index === 'End') {
        const start = new Date(startDateRef);
        const diffInWeeks = Math.ceil((date - start) / (7 * 24 * 60 * 60 * 1000));
        return `Week ${diffInWeeks}`;
      }
      return `Week ${index}`;
    case 'months':
      return format(date, 'MMM yyyy');
    case 'quarters':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    case 'years':
      return date.getFullYear().toString();
    default:
      return index.toString();
  }
}

/**
 * Calculates scale markers for a timeline based on start/end dates and scale
 * 
 * @param {string|Date} startDate - The start date of the timeline
 * @param {string|Date} endDate - The end date of the timeline
 * @param {string} scale - The scale to use ('days', 'weeks', 'months', etc)
 * @returns {Array} Array of scale markers with date, label, and position properties
 */
const calculateScaleMarkers = (startDate, endDate, scale) => {
  if (!startDate || !endDate || scale === 'none') return [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const scaleMarkers = [];
  
  // Reset time components to avoid timezone issues
  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);
  
  let current = new Date(start);
  let index = 1;
  
  // Add start marker (positioned at 0% to match timeline line)
  scaleMarkers.push({
    date: new Date(current),
    label: getScaleLabel(current, scale, index, startDate),
    position: 0 // Match start of timeline line
  });
  
  // Calculate interval based on scale
  while (current < end) {
    const next = getNextScaleDate(current, scale);
    if (next >= end) break;
    
    // Calculate position between 0% and 100%
    const position = ((next - start) / (end - start)) * 100;
    scaleMarkers.push({
      date: new Date(next),
      label: getScaleLabel(next, scale, ++index, startDate),
      position: Math.min(100, Math.max(0, position)) // Keep within 0-100% range
    });
    
    current = next;
  }
  
  // Always add end marker if it's different from the last marker
  const lastMarker = scaleMarkers[scaleMarkers.length - 1];
  const endPosition = 100; // Match end of timeline line
  
  // Only add end marker if it's not the same as the last marker
  if (lastMarker.position < endPosition - 1) { // Small threshold to avoid duplicates
    scaleMarkers.push({
      date: new Date(end),
      label: getScaleLabel(end, scale, 'End', startDate),
      position: endPosition,
      isEndMarker: true
    });
  } else {
    // Update the last marker to be the end marker if they're close
    lastMarker.position = endPosition;
    lastMarker.label = getScaleLabel(end, scale, 'End', startDate);
    lastMarker.date = new Date(end);
    lastMarker.isEndMarker = true;
  }
  
  // Remove the second-to-last marker if it has the same label as the last marker
  if (scaleMarkers.length >= 2) {
    const last = scaleMarkers[scaleMarkers.length - 1];
    const secondToLast = scaleMarkers[scaleMarkers.length - 2];
    
    // If the last two markers have the same label, remove the second-to-last one
    if (secondToLast.label === last.label) {
      // Instead of removing, we'll mark it as hidden so the timeline can handle it appropriately
      secondToLast.hidden = true;
    }
  }
  
  return scaleMarkers;
};

export default calculateScaleMarkers;
