import React, { useState, useEffect, useMemo } from 'react';
import generateTimelineMarkersWithLogging from '../../functions/generateTimelineMarkersWithLogging';
import processBoardItemsWithMarkers from '../../functions/processBoardItemsWithMarkers';
import calculateItemSpacing from '../../functions/calculateItemSpacing';
import { calculateTimelineItemPositions } from '../../functions/calculateTimelineItemPositions';
import { renderTimelineItems } from './renderTimelineItems.jsx'
import filterVisibleTimelineItems from '../../functions/filterVisibleTimelineItems';
import calculateScaleMarkersWithLogging from '../../functions/calculateScaleMarkersWithLogging';
import handleTimelineItemPositionChange from '../../functions/handleTimelineItemPositionChange';
import buildItemToMarkerMap from '../../functions/buildItemToMarkerMap';
import TimelineLogger from '../../utils/logger';
import { useZustandStore } from '../../store/useZustand';
import { useVisibleItems } from '../../hooks/useVisibleItems';

// Timeline subcomponents
import TimelineLine from './TimelineLine';
import TimelineMarkers from './TimelineMarkers';
import TimelineScaleMarkers from './TimelineScaleMarkers';
import TimelineConnectors from './TimelineConnectors';

/**
 * Timeline component that displays a horizontal timeline with markers and draggable items
 * 
 * @param {Function} onItemMove - Callback when an item is moved
 * @param {Function} onHideItem - Callback when an item is hidden/removed
 * @param {Function} onLabelChange - Callback when an item's label is changed
 * @returns {JSX.Element} - Timeline component
 */

const Timeline = ({
  onItemMove,
  onHideItem,
  onLabelChange,
}) => {
  // ...zustand and other hooks
  const timelineParams = useZustandStore(state => state.timelineParams) || {};
  const { startDate, endDate } = timelineParams;
  TimelineLogger.debug('Start/End date types', { startType: typeof startDate, startDate, endType: typeof endDate, endDate });
  TimelineLogger.debug('Timeline params', { timelineParams, startDate, endDate });
  const settings = useZustandStore(state => state.settings) || {};
  const dateColumn = settings?.dateColumn;
  const dateFormat = settings?.dateFormat || 'MMM d, yyyy';
  const datePosition = settings?.datePosition || 'above';
  const position = settings?.position || 'center';
  const scale = settings?.scale || 'none';
  const [markers, setMarkers] = useState([]);
  const storeState = useZustandStore();
  TimelineLogger.debug('Full zustand store', storeState);

  // State for processed board items with dates and positions
  const [processedBoardItems, setProcessedBoardItems] = useState([]);
  
  // State for item-to-marker mapping
  const [itemToMarkerMap, setItemToMarkerMap] = useState(new Map());

  // Use processed timeline items rather than raw board items to guarantee valid dates
  const timelineItems = useZustandStore(state => state.timelineItems) || [];
  const hiddenItemIds = useZustandStore(state => state.hiddenItemIds) || [];
  
  // Filter timeline items by hiddenItemIds
  const visibleTimelineItems = useMemo(() => {
    return filterVisibleTimelineItems(timelineItems, hiddenItemIds);
  }, [timelineItems, hiddenItemIds]);

  // Get raw visible board items for marker generation
  const visibleBoardItems = useVisibleItems();

  // Calculate the scale markers based on scale and date range
  const scaleMarkers = useMemo(() => {
    return calculateScaleMarkersWithLogging(startDate, endDate, scale);
  }, [startDate, endDate, scale]);
  
  // Convert dates and visibleBoardItems to strings for stable dependencies
  const startDateString = startDate?.toISOString();
  const endDateString = endDate?.toISOString();
  const visibleBoardItemsString = JSON.stringify(visibleBoardItems);
  
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
  
  // Handle item position changes during drag
  const onPositionChange = (itemId, newPosition) => {
    handleTimelineItemPositionChange(itemId, newPosition, startDate, endDate, onItemMove);
  };

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
  }, [visibleBoardItemsString, JSON.stringify(visibleTimelineItems?.map(i => i.id)), startDateString, endDateString, JSON.stringify(markers), position, dateColumn]);
  
  // Calculate item spacing to prevent overlaps
  const spacedBoardItems = useMemo(() => {
    return calculateItemSpacing(processedBoardItems, position);
  }, [processedBoardItems, position]);

  // Determine if scale markers should be flipped based on datePosition
  // When position is 'none', markers should be above (no flipping)
  const shouldFlipScaleMarkers = datePosition === 'none' ? false : !datePosition.includes('below');
  
  // Calculate the position for timeline and scale markers
  const timelineTop = position === 'above' ? '75%' : position === 'below' ? '25%' : '50%';
  
  return (
    <div 
      className="timeline-container"
      style={{
        position: 'relative',
        width: '90%', // Use 90% width to ensure padding on both sides
        margin: '0 auto', // Center the timeline
        height: '300px', // Increased height for the timeline container
        padding: '100px 0', // Increased padding to accommodate items above and below
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
    >
      {/* Timeline line */}
      <TimelineLine position={position} />

      {/* Timeline markers */}
      <TimelineMarkers 
        markers={markers}
        datePosition={datePosition}
        timelineTop={timelineTop}
      />
      
      {/* Scale markers */}
      <TimelineScaleMarkers 
        scale={scale}
        scaleMarkers={scaleMarkers}
        timelineTop={timelineTop}
        shouldFlipScaleMarkers={shouldFlipScaleMarkers}
      />

      {/* Board Items - Render all items chronologically with position logic */}
      {(() => {
        // Calculate positions for all items using extracted function
        const itemsWithPositions = calculateTimelineItemPositions(visibleTimelineItems, startDate, endDate, position);
        TimelineLogger.debug('itemsWithPositions', itemsWithPositions);
        // Render items using extracted function
        return renderTimelineItems(
          itemsWithPositions,
          onLabelChange,
          onHideItem,
          onPositionChange,
        );
      })()}
      
      {/* LeaderLine Connectors - Connect board items to timeline markers */}
      <TimelineConnectors 
        visibleTimelineItems={visibleTimelineItems}
        markers={markers}
        itemToMarkerMap={itemToMarkerMap}
      />
    </div>
  );
};

export default Timeline;
