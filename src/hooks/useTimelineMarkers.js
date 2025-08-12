import { useState, useEffect, useMemo } from 'react';
import { useZustandStore } from '../store/useZustand';
import generateTimelineMarkersWithLogging from '../functions/generateTimelineMarkersWithLogging';
import buildItemToMarkerMap from '../functions/buildItemToMarkerMap';
import calculateItemSpacing from '../functions/calculateItemSpacing';
import TimelineLogger from '../utils/logger';

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

  // Get hidden items loaded state to ensure markers are regenerated after hidden items are loaded
  const hiddenItemsLoaded = useZustandStore(state => state.hiddenItemsLoaded);
  const hiddenItemIds = useZustandStore(state => state.hiddenItemIds);

  // Generate timeline markers when board items, date column, date range, or hidden items change
  useEffect(() => {
    // Only generate markers if hidden items have been loaded to prevent stale data
    if (!hiddenItemsLoaded) {
      TimelineLogger.debug('Skipping marker generation - hidden items not loaded yet');
      return;
    }

    TimelineLogger.debug('Generating timeline markers', {
      visibleBoardItemsCount: visibleBoardItems?.length || 0,
      hiddenItemsCount: hiddenItemIds?.length || 0,
      hiddenItemsLoaded
    });

    const generatedMarkers = generateTimelineMarkersWithLogging(
      visibleBoardItems, 
      dateColumn, 
      startDate, 
      endDate, 
      dateFormat
    );
    setMarkers(generatedMarkers);
  }, [visibleBoardItems, dateColumn, startDateString, endDateString, dateFormat, hiddenItemsLoaded, hiddenItemIds]);

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
