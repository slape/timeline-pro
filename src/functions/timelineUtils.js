/**
 * Determines the appropriate scale for a timeline based on start and end dates
 * 
 * @param {Date} startDate - Start date of the timeline
 * @param {Date} endDate - End date of the timeline
 * @param {string} preferredScale - Preferred scale (day, week, month, quarter, year)
 * @returns {string} - The appropriate scale (day, week, month, quarter, year)
 */
const determineTimelineScale = (startDate, endDate, preferredScale = 'auto') => {
  // Calculate the difference in days
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If preferred scale is specified and not 'auto', use that
  if (preferredScale !== 'auto') {
    return preferredScale;
  }
  
  // Determine scale based on the date range
  if (diffDays <= 31) {
    return 'day';
  } else if (diffDays <= 90) {
    return 'week';
  } else if (diffDays <= 365) {
    return 'month';
  } else if (diffDays <= 730) { // ~2 years
    return 'quarter';
  } else {
    return 'year';
  }
};

/**
 * Generates timeline markers based on start date, end date, and scale
 * 
 * @param {Date} startDate - Start date of the timeline
 * @param {Date} endDate - End date of the timeline
 * @param {string} scale - Scale of the timeline (day, week, month, quarter, year)
 * @param {number} maxMarkers - Maximum number of markers to generate
 * @returns {Array} - Array of marker objects with date and label
 */
const generateTimelineMarkers = (startDate, endDate, scale, maxMarkers = 10) => {
  const markers = [];
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let interval;
  let format;
  
  // Determine interval and format based on scale
  switch (scale) {
    case 'day':
      interval = 1;
      format = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      break;
    case 'week':
      interval = 7;
      format = (date) => {
        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() + 6);
        return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      };
      break;
    case 'month':
      interval = 30;
      format = (date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      break;
    case 'quarter':
      interval = 91; // ~3 months
      format = (date) => {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      };
      break;
    case 'year':
      interval = 365;
      format = (date) => date.getFullYear().toString();
      break;
    default:
      interval = 30;
      format = (date) => date.toLocaleDateString();
  }
  
  // Calculate step size to not exceed maxMarkers
  const steps = Math.min(maxMarkers, Math.ceil(diffDays / interval));
  const stepSize = diffDays / steps;
  
  // Generate markers
  for (let i = 0; i <= steps; i++) {
    const daysToAdd = Math.round(i * stepSize);
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + daysToAdd);
    
    markers.push({
      date,
      label: format(date),
      position: i / steps * 100 // Position as percentage
    });
  }
  
  return markers;
};

// Helper function to create date-only Date objects for consistent comparison
const toDateOnly = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Calculates the position of an item on the timeline
 * 
 * @param {Date} itemDate - Date of the item
 * @param {Date} startDate - Start date of the timeline
 * @param {Date} endDate - End date of the timeline
 * @returns {number} - Position as percentage (0-100)
 */
const calculateItemPosition = (itemDate, startDate, endDate) => {
  // Ensure the dates are valid
  if (!(itemDate instanceof Date) || !(startDate instanceof Date) || !(endDate instanceof Date)) {
    console.error('Invalid date provided to calculateItemPosition');
    return 0;
  }
  
  // Convert all dates to date-only for consistent comparison
  const itemDateOnly = toDateOnly(itemDate);
  const startDateOnly = toDateOnly(startDate);
  const endDateOnly = toDateOnly(endDate);
  
  const totalDuration = endDateOnly - startDateOnly;
  const itemDuration = itemDateOnly - startDateOnly;
  
  // Handle edge cases
  if (totalDuration <= 0) return 0;
  if (itemDateOnly < startDateOnly) return 0;
  if (itemDateOnly > endDateOnly) return 100;
  
  // Calculate position as percentage
  return (itemDuration / totalDuration) * 100;
};

export {
  determineTimelineScale,
  generateTimelineMarkers,
  calculateItemPosition
};
