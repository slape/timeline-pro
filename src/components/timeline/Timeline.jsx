import React, { useState, useEffect, useMemo } from 'react';
import getMarkerStyles from '../../functions/getMarkerStyles';
import generateTimelineMarkersFunction from '../../functions/generateTimelineMarkers';
import processBoardItemsWithMarkers from '../../functions/processBoardItemsWithMarkers';
import calculateItemSpacing from '../../functions/calculateItemSpacing';
import { calculateTimelineItemPositions } from '../../functions/calculateTimelineItemPositions';
import { renderTimelineItems } from './renderTimelineItems.jsx'
import LeaderLineConnector from './LeaderLineConnector';
import calculateScaleMarkers from '../../functions/calculateScaleMarkers';

/**
 * Timeline component that displays a horizontal timeline with markers and draggable items
 * 
 * @param {Object} props - Component props
 * @param {Date} props.startDate - Start date of the timeline
 * @param {Date} props.endDate - End date of the timeline
 * @param {string} props.scale - Scale of the timeline (day, week, month, quarter, year, auto)
 * @param {Array} props.items - Array of items to display on the timeline
 * @param {Array} props.boardItems - Array of board items from monday.com for extracting unique dates
 * @param {string} props.dateColumn - The ID of the column containing date values
 * @param {string} props.dateFormat - Format for displaying dates ('mdyy', 'mmddyyyy', 'md', 'mdy')
 * @param {string} props.datePosition - Position and style of date markers ('angled-above', 'horizontal-above', 'angled-below', 'horizontal-below')
 * @param {Function} props.onItemMove - Callback when an item is moved
 * @param {Function} props.onLabelChange - Callback when an item label is changed
 * @param {Function} props.onHideItem - Callback when an item is hidden/removed
 * @param {Set} props.hiddenItemIds - Set of hidden item IDs
 * @param {string} props.position - Position of timeline items ('above', 'below', or 'alternate')
 * @param {string} props.shape - Shape of timeline items ('rectangle', 'circle', 'diamond')
 * @param {boolean} props.showItemDates - Whether to show editable dates on timeline items
 * @returns {JSX.Element} - Timeline component
 */
const Timeline = ({
  startDate = new Date(),
  endDate = new Date(new Date().setMonth(startDate.getMonth() + 3)),
  items = [],
  boardItems = [],
  dateColumn,
  dateFormat = 'mdy',
  datePosition = 'angled-above',
  onHideItem = () => {},
  hiddenItemIds = new Set(),
  position = 'below',
  shape = 'rectangle',
  scale = 'auto',
  showItemDates = false,
}) => {
  // Generate timeline markers from unique dates in board items
  const [markers, setMarkers] = useState([]);
  
  // State for processed board items with dates and positions
  const [processedBoardItems, setProcessedBoardItems] = useState([]);
  
  // State for item-to-marker mapping
  const [itemToMarkerMap, setItemToMarkerMap] = useState(new Map());
  
  // Calculate the scale markers based on scale and date range
  const scaleMarkers = useMemo(() => {
    return calculateScaleMarkers(startDate, endDate, scale);
  }, [startDate, endDate, scale]);
  
  // Convert dates and boardItems to strings for stable dependencies
  const startDateString = startDate.toISOString();
  const endDateString = endDate.toISOString();
  const boardItemsString = JSON.stringify(boardItems);
  
  // Generate timeline markers when board items, date column, date range, or hidden items change
  useEffect(() => {
    // If there are no board items, skip marker generation
    if (!boardItems || boardItems.length === 0) return;
    
    // Filter board items to only include visible ones
    const visibleBoardItems = boardItems.filter(item => !hiddenItemIds.has(item.id));
    
    // Generate markers using only visible items
    const markers = generateTimelineMarkersFunction(
      visibleBoardItems, 
      dateColumn, 
      startDate, 
      endDate, 
      dateFormat
    );
    
    setMarkers(markers);
  }, [boardItemsString, dateColumn, startDateString, endDateString, dateFormat, hiddenItemIds]);
  
  // Handle item position changes during drag
  const handleItemPositionChange = (itemId, newPosition) => {
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

  // Process board items with dates and calculate positions
  useEffect(() => {
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
  }, [boardItemsString, dateColumn, startDateString, endDateString, markers, position]);
  
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
          zIndex: 1,
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
                zIndex: -1
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
              zIndex: 2,
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
        
        // Create connectors for visible items only
        return itemsWithPositions
          .filter(item => !hiddenItemIds.has(item.id)) // Only show connectors for visible items
          .map((item, index) => {
            // Find the corresponding marker for this item
            const markerInfo = itemToMarkerMap.get(item.id);
            if (!markerInfo) return null;
            
            // Find the marker index based on marker position
            const markerIndex = markers.findIndex(marker => 
              Math.abs(marker.position - markerInfo.markerPosition) < 0.1
            );
            
            if (markerIndex === -1) return null;
            
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
