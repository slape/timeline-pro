import React, { useState, useEffect, useMemo } from 'react';
import { determineTimelineScale, calculateItemPosition, generateTimelineMarkers } from '../../functions/timelineUtils';
import getUniqueDates from '../../functions/getUniqueDates';
import getItemsWithDates from '../../functions/getItemsWithDates';
import formatDate from '../../functions/formatDate';
import processBoardItems from '../../functions/processBoardItems';
import getMarkerStyles from '../../functions/getMarkerStyles';
import generateTimelineMarkersFunction from '../../functions/generateTimelineMarkers';
import processBoardItemsWithMarkers from '../../functions/processBoardItemsWithMarkers';
import calculateItemSpacing from '../../functions/calculateItemSpacing';
import { calculateTimelineItemPositions } from '../../functions/calculateTimelineItemPositions';
import { renderTimelineItems } from './renderTimelineItems.jsx'
import TimelineItem from './TimelineItem';
import DraggableBoardItem from './DraggableBoardItem';
import LeaderLineConnector from './LeaderLineConnector';

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
 * @param {string} props.position - Position of timeline items ('above', 'below', or 'alternate')
 * @param {string} props.shape - Shape of timeline items ('rectangle', 'circle', 'diamond')
 * @returns {JSX.Element} - Timeline component
 */
const Timeline = ({
  startDate = new Date(),
  endDate = new Date(new Date().setMonth(startDate.getMonth() + 3)),
  items = [],
  boardItems = [],
  dateColumn,
  dateFormat = 'mdyy',
  datePosition = 'angled-below', // Default to angled-below
  position = 'below', // Default to below
  shape = 'rectangle' // Default to rectangle
}) => {
  // Generate timeline markers from unique dates in board items
  const [markers, setMarkers] = useState([]);
  
  // State for processed board items with dates and positions
  const [processedBoardItems, setProcessedBoardItems] = useState([]);
  
  // State for item-to-marker mapping
  const [itemToMarkerMap, setItemToMarkerMap] = useState(new Map());
  
  // State to track which items are hidden (removed from view)
  const [hiddenItemIds, setHiddenItemIds] = useState(new Set());
  
  // Convert dates and boardItems to strings for stable dependencies
  const startDateString = startDate.toISOString();
  const endDateString = endDate.toISOString();
  const boardItemsString = JSON.stringify(boardItems);
  
  // Generate timeline markers when board items, date column, or date range changes
  useEffect(() => {
    const markers = generateTimelineMarkersFunction(boardItems, dateColumn, startDate, endDate, dateFormat);
    setMarkers(markers);
  }, [boardItemsString, dateColumn, startDateString, endDateString, dateFormat]);
  
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
        alignItems: 'center', // Center the timeline vertically
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
        
        // Calculate dynamic marker position based on timeline position
        const timelineTop = position === 'above' ? '75%' : position === 'below' ? '25%' : '50%';
        const isAbove = datePosition.includes('above');
        
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
            }}
          >
            <div
              style={markerStyles.markerLine}
            />
            <div
              style={markerStyles.dateLabel}
            >
              {marker.label}
            </div>
          </div>
        );
      })}

      {/* Board Items - Render all items chronologically with position logic */}
      {(() => {
        // Calculate positions for all items using extracted function
        const itemsWithPositions = calculateTimelineItemPositions(items, startDate, endDate, position);
        
        // Render items using extracted function
        return renderTimelineItems(
          itemsWithPositions,
          (item) => console.log('Board item clicked:', item),
          (itemId, newLabel) => {
            console.log('Label changed:', itemId, newLabel);
            // TODO: Implement label change handler
          },
          (itemId) => {
            console.log('Remove item:', itemId);
            // Hide the item by adding its ID to hiddenItemIds
            setHiddenItemIds(prev => new Set([...prev, itemId]));
          },
          shape,
          hiddenItemIds
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
