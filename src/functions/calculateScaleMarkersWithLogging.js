import calculateScaleMarkers from './calculateScaleMarkers';
import TimelineLogger from '../utils/logger';

/**
 * Calculates scale markers with performance logging
 * 
 * @param {Date} startDate - Start date for the timeline
 * @param {Date} endDate - End date for the timeline
 * @param {string} scale - Scale type (weeks, days, etc.)
 * @returns {Array} - Array of scale markers
 */
const calculateScaleMarkersWithLogging = (startDate, endDate, scale) => {
  const startTime = Date.now();
  const markers = calculateScaleMarkers(startDate, endDate, scale);
  
  if (markers.length > 0) {
    const duration = Date.now() - startTime;
    TimelineLogger.performance('calculateScaleMarkers', duration, {
      markerCount: markers.length,
      scale,
      dateRangeDays: Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
    });
  }
  
  return markers;
};

export default calculateScaleMarkersWithLogging;
