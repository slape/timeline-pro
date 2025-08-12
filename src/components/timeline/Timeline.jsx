import React from 'react';
import { calculateTimelineItemPositions } from '../../functions/calculateTimelineItemPositions';
import { renderTimelineItems } from './renderTimelineItems.jsx';
import { calculateTimelineLayout, TIMELINE_CONTAINER_STYLES } from '../../functions/calculateTimelineLayout';
import TimelineLogger from '../../utils/logger';

// Custom hooks
import { useTimelineSettings } from '../../hooks/useTimelineSettings';
import { useTimelineData } from '../../hooks/useTimelineData';
import { useTimelineMarkers } from '../../hooks/useTimelineMarkers';
import { useTimelineCallbacks } from '../../hooks/useTimelineCallbacks';

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
  // Extract timeline settings
  const {
    startDate,
    endDate,
    dateColumn,
    dateFormat,
    datePosition,
    position,
    scale,
  } = useTimelineSettings();

  // Debug logging
  TimelineLogger.debug('Start/End date types', { 
    startType: typeof startDate, 
    startDate, 
    endType: typeof endDate, 
    endDate 
  });

  // Get timeline data
  const {
    visibleBoardItems,
    visibleTimelineItems,
    scaleMarkers,
    startDateString,
    endDateString,
    visibleBoardItemsString,
  } = useTimelineData(startDate, endDate, scale);

  // Get timeline markers and mappings
  const {
    markers,
    itemToMarkerMap,
  } = useTimelineMarkers({
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
  });

  // Get callback functions
  const { onPositionChange } = useTimelineCallbacks(startDate, endDate, onItemMove);

  // Calculate layout values
  const { shouldFlipScaleMarkers, timelineTop } = calculateTimelineLayout(position, datePosition);
  
  return (
    <div 
      className="timeline-container"
      style={TIMELINE_CONTAINER_STYLES}
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
