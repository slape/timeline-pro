import { useCallback } from 'react';
import handleTimelineItemPositionChange from '../functions/handleTimelineItemPositionChange';

/**
 * Custom hook to manage timeline callback functions
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {Function} onItemMove - Callback when an item is moved
 * @returns {Object} Callback functions
 */
export const useTimelineCallbacks = (startDate, endDate, onItemMove) => {
  // Handle item position changes during drag
  const onPositionChange = useCallback((itemId, newPosition) => {
    handleTimelineItemPositionChange(itemId, newPosition, startDate, endDate, onItemMove);
  }, [startDate, endDate, onItemMove]);

  return {
    onPositionChange,
  };
};
