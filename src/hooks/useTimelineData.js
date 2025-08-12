import { useMemo } from 'react';
import { useZustandStore } from '../store/useZustand';
import { useVisibleItems } from './useVisibleItems';
import filterVisibleTimelineItems from '../functions/filterVisibleTimelineItems';
import calculateScaleMarkersWithLogging from '../functions/calculateScaleMarkersWithLogging';

/**
 * Custom hook to manage timeline data and computed values
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {string} scale - Timeline scale setting
 * @returns {Object} Timeline data including items, markers, and computed values
 */
export const useTimelineData = (startDate, endDate, scale) => {
  // Get data from store
  const timelineItems = useZustandStore(state => state.timelineItems) || [];
  const hiddenItemIds = useZustandStore(state => state.hiddenItemIds) || [];
  
  // Get raw visible board items for marker generation
  const visibleBoardItems = useVisibleItems();
  
  // Filter timeline items by hiddenItemIds
  const visibleTimelineItems = useMemo(() => {
    return filterVisibleTimelineItems(timelineItems, hiddenItemIds);
  }, [timelineItems, hiddenItemIds]);
  
  // Calculate the scale markers based on scale and date range
  const scaleMarkers = useMemo(() => {
    return calculateScaleMarkersWithLogging(startDate, endDate, scale);
  }, [startDate, endDate, scale]);
  
  // Convert dates and visibleBoardItems to strings for stable dependencies
  const startDateString = startDate?.toISOString();
  const endDateString = endDate?.toISOString();
  const visibleBoardItemsString = JSON.stringify(visibleBoardItems);
  
  return {
    timelineItems,
    hiddenItemIds,
    visibleBoardItems,
    visibleTimelineItems,
    scaleMarkers,
    // Stable dependency strings
    startDateString,
    endDateString,
    visibleBoardItemsString,
  };
};
