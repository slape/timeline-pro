import React, { useState, useEffect } from 'react';
import { useDraggable, DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { EditableText, Tooltip } from '@vibe/core';
import { determineTimelineScale, generateTimelineMarkers, calculateItemPosition } from '../../functions/timelineUtils';
import DraggableBoardItem from './DraggableBoardItem';

/**
 * TimelineItem component for individual draggable points on the timeline
 */
const TimelineItem = ({ id, label, position, onLabelChange, originalItem, itemPosition = 'below' }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { label, position, originalItem }
  });
  
  // Base style for the timeline item
  const style = {
    position: 'absolute',
    left: `${position}%`,
    transform: transform ? `translate3d(${transform.x}px, 0px, 0)` : 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 10 : 1,
    transition: isDragging ? undefined : 'transform 0.2s ease',
  };
  
  // Adjust vertical position based on itemPosition
  if (itemPosition === 'above') {
    style.top = 'calc(50% - 60px)'; // Position further above the timeline
    style.flexDirection = 'column-reverse'; // Reverse the flex direction for above items
  } else {
    style.top = 'calc(50% + 10px)'; // Position further below the timeline
  }

  // If we have no original item, render a simple dot
  if (!originalItem) {
    return (
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-color)',
            marginBottom: '8px',
            boxShadow: isDragging ? '0 2px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    );
  }

  // Render a small dot on the timeline
  const dotStyle = {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: originalItem.originalItem.group?.color ? `var(--${originalItem.originalItem.group.color}-color)` : 'var(--primary-color)',
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 2,
    boxShadow: '0 0 0 2px white', // Add white border for better visibility
  };

  // Calculate position for the board item card
  const cardStyle = {
    position: 'relative',
    transform: 'translateX(-50%)',
    zIndex: isDragging ? 10 : 1,
    width: '200px', // Set a fixed width for the card
    margin: itemPosition === 'above' ? '0 0 30px 0' : '30px 0 0 0', // Add margin based on position
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {/* The dot on the timeline */}
      <div 
        style={{
          position: 'absolute',
          left: '50%',
          top: itemPosition === 'above' ? 'calc(100% + 30px)' : 'calc(0% - 30px)',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div style={dotStyle} />
      </div>
      
      {/* The board item card */}
      <div style={cardStyle}>
        <DraggableBoardItem 
          item={originalItem.originalItem} 
          date={originalItem.originalItem.parsedDate || new Date()} 
        />
      </div>
    </div>
  );
};

/**
 * Timeline component that displays a horizontal timeline with markers and draggable items
 * 
 * @param {Object} props - Component props
 * @param {Date} props.startDate - Start date of the timeline
 * @param {Date} props.endDate - End date of the timeline
 * @param {string} props.scale - Scale of the timeline (day, week, month, quarter, year, auto)
 * @param {Array} props.items - Array of items to display on the timeline
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
  onItemMove,
  onLabelChange,
  position = 'below' // Default to below
}) => {
  // Determine the appropriate scale based on date range
  const timelineScale = determineTimelineScale(startDate, endDate, scale);
  
  // Generate timeline markers
  const [markers, setMarkers] = useState([]);
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum distance before drag starts
      },
    })
  );
  
  // Generate timeline markers when dates or scale changes
  useEffect(() => {
    setMarkers(generateTimelineMarkers(startDate, endDate, timelineScale));
  }, [startDate, endDate, timelineScale]);
  
  // Handle drag end event
  const handleDragEnd = (event) => {
    const { active, delta } = event;
    
    if (active && onItemMove) {
      // Calculate new position based on delta
      const timelineWidth = document.querySelector('.timeline-track').offsetWidth;
      const percentageMoved = (delta.x / timelineWidth) * 100;
      
      // Find the item and update its position
      const itemId = active.id;
      const currentPosition = items.find(item => item.id === itemId)?.position || 0;
      let newPosition = Math.max(0, Math.min(100, currentPosition + percentageMoved));
      
      onItemMove(itemId, newPosition);
    }
  };
  
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
        // Check if this is the first or last marker
        const isEndMarker = index === 0 || index === markers.length - 1;
        
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
                transform: isEndMarker ? 'translateX(0)' : 'rotate(-45deg)',
                transformOrigin: index === 0 ? 'left top' : index === markers.length - 1 ? 'right top' : 'left top',
                marginTop: '4px',
                marginLeft: index === 0 ? '-10px' : 'auto',
                marginRight: index === markers.length - 1 ? '-10px' : 'auto',
                textAlign: index === 0 ? 'left' : index === markers.length - 1 ? 'right' : 'center',
              }}
            >
              {marker.label}
            </div>
          </div>
        );
      })}

      {/* Draggable items */}
      <DndContext 
        sensors={sensors}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
      >
        {items.map((item, index) => {
          // Determine item position based on the position prop
          let itemPosition = position;
          
          // If position is 'alternate', alternate between 'above' and 'below'
          if (position === 'alternate') {
            itemPosition = index % 2 === 0 ? 'below' : 'above';
          }
          
          return (
            <TimelineItem
              key={item.id}
              id={item.id}
              label={item.label}
              position={item.position || calculateItemPosition(item.date, startDate, endDate)}
              onLabelChange={handleLabelChange}
              originalItem={item}
              itemPosition={itemPosition}
            />
          );
        })}
      </DndContext>
    </div>
  );
};

export default Timeline;
