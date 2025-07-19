import React, { useState, useEffect, useMemo } from 'react';
import { determineTimelineScale, calculateItemPosition, generateTimelineMarkers } from '../../functions/timelineUtils';
import getUniqueDates from '../../functions/getUniqueDates';
import formatDate from '../../functions/formatDate';
import TimelineItem from './TimelineItem';

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
 * @param {Function} props.onItemMove - Callback when an item is moved
 * @param {Function} props.onLabelChange - Callback when an item label is changed
 * @param {string} props.position - Position of timeline items ('above', 'below', or 'alternate')
 * @returns {JSX.Element} - Timeline component
 */
const Timeline = ({
  startDate = new Date(),
  endDate = new Date(new Date().setMonth(startDate.getMonth() + 3)),
  scale = 'auto',
  items = [],
  boardItems = [],
  dateColumn,
  dateFormat = 'mdyy',
  onItemMove,
  onLabelChange,
  position = 'below' // Default to below
}) => {
  // Generate timeline markers from unique dates in board items
  const [markers, setMarkers] = useState([]);
  
  // Convert dates and boardItems to strings for stable dependencies
  const startDateString = startDate.toISOString();
  const endDateString = endDate.toISOString();
  const boardItemsString = JSON.stringify(boardItems);
  
  // Generate timeline markers when board items, date column, or date range changes
  useEffect(() => {
    if (boardItems.length > 0 && dateColumn) {
      // Get unique dates from board items
      const uniqueDates = getUniqueDates(boardItems, dateColumn);
      
      if (uniqueDates.length > 0) {
        // Find the actual date range from the board items
        const actualStartDate = new Date(Math.min(...uniqueDates.map(d => d.getTime())));
        const actualEndDate = new Date(Math.max(...uniqueDates.map(d => d.getTime())));
        
        // Use the actual date range from board items, or fall back to provided start/end dates
        const timelineStart = actualStartDate < startDate ? actualStartDate : startDate;
        const timelineEnd = actualEndDate > endDate ? actualEndDate : endDate;
        
        // Create markers for each unique date using the expanded timeline range
        const dateMarkers = uniqueDates.map(date => ({
          date,
          label: formatDate(date, dateFormat),
          position: calculateItemPosition(date, timelineStart, timelineEnd)
        }));
        
        // Add start and end markers only if they're not already covered by the data
        const allMarkers = [...dateMarkers];
        
        // Add start marker if it's different from the earliest data date
        if (timelineStart.getTime() !== actualStartDate.getTime()) {
          allMarkers.push({
            date: timelineStart,
            label: formatDate(timelineStart, dateFormat),
            position: 0
          });
        }
        
        // Add end marker if it's different from the latest data date
        if (timelineEnd.getTime() !== actualEndDate.getTime()) {
          allMarkers.push({
            date: timelineEnd,
            label: formatDate(timelineEnd, dateFormat),
            position: 100
          });
        }
        
        // Remove duplicates and sort by position
        const uniqueMarkers = allMarkers.filter((marker, index, self) => 
          index === self.findIndex(m => Math.abs(m.position - marker.position) < 0.1)
        );
        
        const sortedMarkers = uniqueMarkers.sort((a, b) => a.position - b.position);
        setMarkers(sortedMarkers);
      } else {
        // No dates found in board items, use default markers
        setMarkers([
          {
            date: startDate,
            label: formatDate(startDate, dateFormat),
            position: 0
          },
          {
            date: endDate,
            label: formatDate(endDate, dateFormat),
            position: 100
          }
        ]);
      }
    } else {
      // Fallback to default start/end markers if no board items or date column
      setMarkers([
        {
          date: startDate,
          label: formatDate(startDate, dateFormat),
          position: 0
        },
        {
          date: endDate,
          label: formatDate(endDate, dateFormat),
          position: 100
        }
      ]);
    }
  }, [boardItemsString, dateColumn, startDateString, endDateString, dateFormat]);
  

  
  // Handle label change
  const handleLabelChange = (itemId, newLabel) => {
    if (onLabelChange) {
      onLabelChange(itemId, newLabel);
    }
  };
  
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
          top: '50%', // Center the line vertically
          left: 0,
          width: '100%',
          height: '2px',
          backgroundColor: 'var(--ui-border-color)',
          zIndex: 1,
        }}
      />

      {/* Timeline markers */}
      {markers.map((marker, index) => {
        return (
          <div
            key={`marker-${index}`}
            style={{
              position: 'absolute',
              left: `${marker.position}%`,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              top: '50%', // Center the marker vertically
            }}
          >
            <div
              style={{
                width: '1px',
                height: '8px',
                backgroundColor: 'var(--ui-border-color)',
                marginBottom: '4px',
              }}
            />
            <div
              style={{
                fontSize: '10px',
                color: 'var(--secondary-text-color)',
                whiteSpace: 'nowrap',
                transform: 'rotate(-25deg)',
                transformOrigin: 'center bottom',
                marginTop: '4px',
                textAlign: 'center',
              }}
            >
              {marker.label}
            </div>
          </div>
        );
      })}

      {/* Timeline items */}
      {items.map((item, index) => {
        // Determine item position based on the position prop
        let itemPosition = position;
        
        // If position is 'alternate', alternate between 'above' and 'below'
        if (position === 'alternate') {
          itemPosition = index % 2 === 0 ? 'below' : 'above';
        }
        
        return (
          // <TimelineItem
          //   key={item.id}
          //   id={item.id}
          //   label={item.label}
          //   position={item.position || calculateItemPosition(item.date, startDate, endDate)}
          //   onLabelChange={handleLabelChange}
          //   originalItem={item}
          //   itemPosition={itemPosition}
          // />
          <div></div>
        );
      })}
    </div>
  );
};

export default Timeline;
