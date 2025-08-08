import React, { useState, useEffect, useMemo } from 'react';
import getMarkerStyles from '../../functions/getMarkerStyles';
import generateTimelineMarkers from '../../functions/generateTimelineMarkers';
import processBoardItemsWithMarkers from '../../functions/processBoardItemsWithMarkers';
import calculateItemSpacing from '../../functions/calculateItemSpacing';
import { calculateTimelineItemPositions } from '../../functions/calculateTimelineItemPositions';
import { renderTimelineItems } from './renderTimelineItems.jsx'
import LeaderLineConnector from './LeaderLineConnector';
import calculateScaleMarkers from '../../functions/calculateScaleMarkers';
import TimelineLogger from '../../utils/logger';
import { useZustandStore } from '../../store/useZustand';
import InvalidTimelineDates from './InvalidTimelineDates';

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
  const hiddenItemIds = useZustandStore(state => state.hiddenItemIds);
  // Use processed timeline items rather than raw board items to guarantee valid dates
  const timelineItems = useZustandStore(state => state.timelineItems) || [];
  // Keep raw board items available for marker generation functions that expect original shape
  const boardItems = useZustandStore(state => state.boardItems) || [];
  const timelineParams = useZustandStore(state => state.timelineParams) || {};
  const { startDate, endDate } = timelineParams;
  TimelineLogger.debug('Start/End date types', { startType: typeof startDate, startDate, endType: typeof endDate, endDate });
  TimelineLogger.debug('Timeline params', { timelineParams, startDate, endDate });
  const settings = useZustandStore(state => state.settings) || {};
  const items = (timelineItems || []).filter(item => !hiddenItemIds.has(item.id));
  const dateColumn = settings?.dateColumn;
  const dateFormat = settings?.dateFormat || 'MMM d, yyyy';
  const datePosition = settings?.datePosition || 'above';
  const position = settings?.position || 'center';
  const shape = settings?.shape || 'rectangle';
  const showItemDates = settings?.itemDates ?? settings?.showItemDates ?? true;
  const scale = settings?.scale || 'none';
  const [markers, setMarkers] = useState([]);
  const storeState = useZustandStore();
  TimelineLogger.debug('Full zustand store', storeState);

  const isValidDate = d => d instanceof Date && !isNaN(d);
  
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return <InvalidTimelineDates />;
  }

  // State for processed board items with dates and positions
  const [processedBoardItems, setProcessedBoardItems] = useState([]);
  
  // State for item-to-marker mapping
  const [itemToMarkerMap, setItemToMarkerMap] = useState(new Map());
  
  // Calculate the scale markers based on scale and date range
  const scaleMarkers = useMemo(() => {
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
  }, [startDate, endDate, scale]);
  
  // Convert dates and boardItems to strings for stable dependencies
  const startDateString = startDate?.toISOString();
  const endDateString = endDate?.toISOString();
  const boardItemsString = JSON.stringify(boardItems);
  
  // Generate timeline markers when board items, date column, date range, or hidden items change
  useEffect(() => {
    TimelineLogger.debug('Timeline: Generating markers', {
      boardItemCount: boardItems?.length || 0,
      dateColumn,
      hiddenItemCount: hiddenItemIds.size,
      visibleItemCount: boardItems?.filter(item => !hiddenItemIds.has(item.id)).length || 0
    });

    const startTime = Date.now();
    let generatedMarkers = [];
    // Generate markers (function handles empty board items by returning start/end markers)
    try {
      TimelineLogger.debug('[Timeline] Calling generateTimelineMarkers', {
        boardItemsCount: (boardItems || []).length,
        dateColumnId: typeof dateColumn === 'object' ? dateColumn?.id : dateColumn,
        hasDateColumn: !!dateColumn,
        startDate,
        endDate,
        dateFormat
      });
      generatedMarkers = generateTimelineMarkers(boardItems || [], dateColumn, startDate, endDate, dateFormat);
      setMarkers(generatedMarkers);
      TimelineLogger.debug('[Timeline] Markers generated', { count: generatedMarkers?.length || 0, markers: generatedMarkers });
    } catch (e) {
      TimelineLogger.error('[Timeline] generateTimelineMarkers threw', e, {
        boardItemsCount: (boardItems || []).length,
        dateColumn
      });
    }
    
    const duration = Date.now() - startTime;
    TimelineLogger.performance('generateTimelineMarkers', duration, {
      markerCount: generatedMarkers?.length || 0,
      visibleBoardItemCount: (boardItems || []).filter(item => !hiddenItemIds.has(item.id)).length
    });
  }, [boardItemsString, dateColumn, startDateString, endDateString, dateFormat, hiddenItemIds]);
  
  // Handle item position changes during drag
  const handleItemPositionChange = (itemId, newPosition) => {
    TimelineLogger.userAction('timelineItemDragged', { itemId, newPosition });
    // Update the item's position in the items array
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        // Calculate the new date based on the X position percentage
        const timeRange = endDate - startDate;
        const newDate = new Date(startDate.getTime() + (newPosition.x / 100) * timeRange);
        
        return {
          ...item,
          date: newDate,
          // Update the render position to match the dragged position
          renderPosition: {
            ...(item.renderPosition || {}),
            x: newPosition.x,
            y: newPosition.y
          }
        };
      }
      return item;
    });

    // If there's an onItemMove callback, call it with the updated items
    if (onItemMove) {
      onItemMove(updatedItems);
    }
  };

  // Handle item removal
  const handleItemRemove = (itemId) => {
    // Call the parent component's onHideItem function
    onHideItem(itemId);
  };

  // Process items to map each item to its closest marker
  useEffect(() => {
    TimelineLogger.debug('[Timeline] Building item→marker map', { boardItemsCount: boardItems?.length || 0, timelineItemsCount: items?.length || 0, markersCount: markers?.length || 0 });
    // If we have raw board items and a date column, use the existing processor
    if (boardItems && boardItems.length > 0 && dateColumn) {
      const result = processBoardItemsWithMarkers(
        boardItems,
        dateColumn,
        startDate,
        endDate,
        position,
        markers
      );
      setProcessedBoardItems(result.processedBoardItems);
      setItemToMarkerMap(result.itemToMarkerMap);
      TimelineLogger.debug('[Timeline] Map built via boardItems processor', { mapped: result.itemToMarkerMap?.size || 0 });
      return;
    }

    // Fallback: derive mapping directly from current timeline items and markers
    const map = new Map();
    (items || []).forEach(item => {
      if (!item?.date || !(item.date instanceof Date) || isNaN(item.date)) return;
      // Compute timeline position percentage for the item's date
      const timeRange = endDate - startDate;
      if (!timeRange || timeRange <= 0) return;
      const positionPct = ((item.date - startDate) / timeRange) * 100;
      if (!markers || markers.length === 0) return;
      // Find nearest marker by position
      let nearestIndex = 0;
      let nearestDist = Infinity;
      markers.forEach((m, idx) => {
        const d = Math.abs(m.position - positionPct);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIndex = idx;
        }
      });
      const targetMarker = markers[nearestIndex];
      if (!targetMarker) return;
      map.set(item.id, {
        markerIndex: nearestIndex,
        markerId: `marker-${nearestIndex}`,
        markerPosition: targetMarker.position,
        markerDate: targetMarker.date,
        itemPosition: positionPct
      });
    });
    setItemToMarkerMap(map);
    TimelineLogger.debug('[Timeline] Map built via fallback', { mapped: map.size });
  }, [boardItemsString, JSON.stringify(items?.map(i => i.id)), startDateString, endDateString, JSON.stringify(markers), position, dateColumn]);
  
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
      <div
        style={{
          position: 'absolute',
          top: position === 'above' ? '75%' : position === 'below' ? '25%' : '50%', // Dynamic positioning based on item placement
          left: 0,
          width: '100%',
          height: '2px',
          backgroundColor: 'var(--ui-border-color)',
          zIndex: 0,
        }}
      />


      {/* Timeline markers */}
      {markers.map((marker, index) => {
        const markerStyles = getMarkerStyles(datePosition);
        const isEdgeMarker = index === 0 || index === markers.length - 1;
        const isAbove = datePosition.includes('above');
        
        // For 'none' date position, only show the marker and label for first and last markers
        const showMarker = datePosition !== 'none' || isEdgeMarker;
        
        // Always render a hidden anchor point for connector lines
        if (!showMarker) {
          return (
            <div
              key={`marker-${index}`}
              id={`timeline-marker-${index}`}
              style={{
                position: 'absolute',
                left: `${marker.position}%`,
                top: timelineTop,
                width: '1px',
                height: '1px',
                pointerEvents: 'none',
                opacity: 0,
                zIndex: 2
              }}
            />
          );
        }
        
        return (
          <div
            key={`marker-${index}`}
            id={`timeline-marker-${index}`}
            style={{
              position: 'absolute',
              left: `${marker.position}%`,
              top: timelineTop,
              transform: isAbove ? 'translateX(-50%) translateY(-100%)' : 'translateX(-50%)',
              display: 'flex',
              ...markerStyles.markerContainer,
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            <div style={markerStyles.markerLine} />
            <div style={markerStyles.dateLabel}>
              {marker.label}
            </div>
          </div>
        );
      })}
      
      {/* Scale markers - only show if scale is not 'none' */}
      {scale !== 'none' && (
        <>
          {/* Scale marker line */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: '100%',
              top: timelineTop, // Use the same top position as the timeline
              height: '1px',
              backgroundColor: 'var(--ui-border-color)',
              zIndex: 1,
            }}
          />
          
          {/* Scale marker ticks and labels */}
          {scaleMarkers.map((marker, index) => {
            // Skip rendering hidden markers (like the second-to-last marker if it matches the last one)
            if (marker.hidden) return null;
            
            const isAbove = !shouldFlipScaleMarkers;
            const offset = shouldFlipScaleMarkers ? 3 : -28; // -1px when flipped (below), -23px when not flipped (above)
            
            return (
              <div
                key={`scale-marker-${index}`}
                style={{
                  position: 'absolute',
                  left: `${marker.position}%`,
                  top: `calc(${timelineTop} + ${offset}px)`, // Offset from timeline position
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: isAbove ? 'column-reverse' : 'column', // column-reverse for above, column for below
                  alignItems: 'center',
                  zIndex: 2,
                }}
              >
                <div 
                  style={{
                    width: '1px',
                    height: '8px',
                    backgroundColor: 'var(--ui-border-color)',
                    flexShrink: 0,
                    marginTop: isAbove ? 0 : 0, // No margin needed when using proper offsets
                    marginBottom: isAbove ? '-1px' : 0, // Connect to timeline when above
                  }}
                />
                <div 
                  style={{
                    fontSize: '10px',
                    color: 'var(--secondary-text-color)',
                    whiteSpace: 'nowrap',
                    marginTop: isAbove ? '0px' : '8px', // Add space below the tick when markers are below
                    marginBottom: isAbove ? '8px' : '0px', // Add space above the tick when markers are above
                    textAlign: 'center',
                    transform: scale === 'days' ? 'rotate(-25deg)' : 'none',
                    transformOrigin: isAbove ? 'center bottom' : 'center top',
                  }}
                >
                  {marker.label}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Board Items - Render all items chronologically with position logic */}
      {(() => {
        // Calculate positions for all items using extracted function
        const itemsWithPositions = calculateTimelineItemPositions(items, startDate, endDate, position);
        TimelineLogger.debug('itemsWithPositions', itemsWithPositions);
        // Render items using extracted function
        return renderTimelineItems(
          itemsWithPositions,
          (item) => {/* console.log('Board item clicked:', item) */},
          (itemId, newLabel) => {
            // console.log('Label changed:', itemId, newLabel);
            // TODO: Implement label change handler
          },
          (itemId) => {
            // console.log('Remove item:', itemId);
            // Use the onHideItem prop callback instead of internal state
            onHideItem(itemId);
          },
          shape,
          hiddenItemIds,
          showItemDates,
          handleItemPositionChange // Pass the position change handler
        );
      })()}
      
      {/* LeaderLine Connectors - Connect board items to timeline markers */}
      {(() => {
        // Calculate positions for all items using extracted function
        const itemsWithPositions = calculateTimelineItemPositions(items, startDate, endDate, position);
        const total = itemsWithPositions.length;
        const visible = itemsWithPositions.filter(i => !hiddenItemIds.has(i.id));
        if (total === 0) {
          TimelineLogger.debug('[Timeline] No itemsWithPositions -> no connectors');
        } else if (visible.length === 0) {
          TimelineLogger.debug('[Timeline] All items hidden -> no connectors', { total });
        } else if (!markers || markers.length === 0) {
          TimelineLogger.debug('[Timeline] No markers -> no connectors');
        }
        
        // Create connectors for visible items only
        return visible
          .map((item) => {
            // Find the corresponding marker for this item
            const markerInfo = itemToMarkerMap.get(item.id);
            if (!markerInfo) return null;

            // Prefer explicit markerIndex if available
            let markerIndex = markerInfo.markerIndex;

            // Fallback 1: parse index from markerId like `marker-<n>`
            if (markerIndex == null && typeof markerInfo.markerId === 'string') {
              const m = markerInfo.markerId.match(/marker-(\d+)/);
              if (m) markerIndex = parseInt(m[1], 10);
            }

            // Fallback 2: compute by nearest position
            if (markerIndex == null || isNaN(markerIndex)) {
              markerIndex = markers.findIndex(marker => 
                Math.abs(marker.position - markerInfo.markerPosition) < 0.5 // widen tolerance
              );
            }
            
            if (markerIndex == null || markerIndex < 0 || markerIndex >= markers.length) return null;
            
            return (
              <LeaderLineConnector
                key={`connector-${item.id}`}
                fromId={`board-item-${item.id}`}
                toId={`timeline-marker-${markerIndex}`}
              />
            );
          })
          .filter(Boolean); // Remove null values
      })()}
    </div>
  );
};

export default Timeline;
