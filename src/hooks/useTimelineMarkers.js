import { useState, useEffect, useMemo } from 'react';
import generateTimelineMarkersWithLogging from '../functions/generateTimelineMarkersWithLogging';
import buildItemToMarkerMap from '../functions/buildItemToMarkerMap';
import calculateItemSpacing from '../functions/calculateItemSpacing';

/**
 * Custom hook to manage timeline markers and item-to-marker mapping
 * @param {Object} params - Hook parameters
 * @param {Array} params.visibleBoardItems - Visible board items
 * @param {Array} params.visibleTimelineItems - Visible timeline items
 * @param {string} params.dateColumn - Date column setting
 * @param {Date} params.startDate - Timeline start date
 * @param {Date} params.endDate - Timeline end date
 * @param {string} params.dateFormat - Date format setting
 * @param {string} params.position - Timeline position setting
 * @param {string} params.startDateString - Stable start date string
 * @param {string} params.endDateString - Stable end date string
 * @param {string} params.visibleBoardItemsString - Stable board items string
 * @returns {Object} Markers and mapping data
 */
export const useTimelineMarkers = ({
  visibleBoardItems,
  visibleTimelineItems,
  dateColumn,
  startDate,
  endDate,
  dateFormat,
  position,
  startDateString,
  endDateString,
  visibleBoardItemsString,
}) => {
  const [markers, setMarkers] = useState([]);
  const [processedBoardItems, setProcessedBoardItems] = useState([]);
  const [itemToMarkerMap, setItemToMarkerMap] = useState(new Map());

  // Generate timeline markers when board items, date column, date range, or hidden items change
  useEffect(() => {
    const generatedMarkers = generateTimelineMarkersWithLogging(
      visibleBoardItems, 
      dateColumn, 
      startDate, 
      endDate, 
      dateFormat
    );
    setMarkers(generatedMarkers);
  }, [visibleBoardItems, dateColumn, startDateString, endDateString, dateFormat]);

  // Process items to map each item to its closest marker
  useEffect(() => {
    const result = buildItemToMarkerMap({
      visibleBoardItems,
      visibleTimelineItems,
      dateColumn,
      startDate,
      endDate,
      position,
      markers
    });
    
    if (result.processedBoardItems) {
      setProcessedBoardItems(result.processedBoardItems);
    }
    setItemToMarkerMap(result.itemToMarkerMap);
  }, [
    visibleBoardItemsString, 
    JSON.stringify(visibleTimelineItems?.map(i => i.id)), 
    startDateString, 
    endDateString, 
    JSON.stringify(markers), 
    position, 
    dateColumn
  ]);

  // Calculate item spacing to prevent overlaps
  const spacedBoardItems = useMemo(() => {
    return calculateItemSpacing(processedBoardItems, position);
  }, [processedBoardItems, position]);

  return {
    markers,
    processedBoardItems,
    itemToMarkerMap,
    spacedBoardItems,
  };
};
