import React, { useState, useEffect } from 'react';
import { useDraggable, DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { EditableText, Tooltip } from '@vibe/core';
import { determineTimelineScale, generateTimelineMarkers, calculateItemPosition } from '../../functions/timelineUtils';

/**
 * TimelineItem component for individual draggable points on the timeline
 */
const TimelineItem = ({ id, label, position, onLabelChange }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { label, position }
  });

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
    top: '-5px', // Position dot to center on the line
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color)',
          marginBottom: '8px',
          boxShadow: isDragging ? '0 2px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.2)',
          border: '1px solid white', // Add border for better visibility
        }}
      />
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
 * @returns {JSX.Element} - Timeline component
 */
const Timeline = ({
  startDate = new Date(),
  endDate = new Date(new Date().setMonth(startDate.getMonth() + 3)),
  scale = 'auto',
  items = [],
  onItemMove,
  onLabelChange
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
      style={{
        width: '100%',
        padding: '30px 0',
        position: 'relative',
        overflow: 'hidden', // Prevent content from overflowing
      }}
    >
      {/* Timeline container with padding */}
      <div style={{
        width: '90%', // Use 90% of the container width to ensure padding on sides
        margin: '0 auto', // Center the timeline
        position: 'relative',
      }}>
        {/* Timeline track */}
        <div 
          className="timeline-track"
          style={{
            height: '2px',
            backgroundColor: 'var(--ui-border-color)',
            width: '100%',
            position: 'relative',
            marginBottom: '40px',
          }}
        >
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
        </div>
      
        {/* Draggable items */}
        <DndContext 
          sensors={sensors}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
        >
          {items.map((item) => (
            <TimelineItem
              key={item.id}
              id={item.id}
              label={item.label}
              position={item.position || calculateItemPosition(item.date, startDate, endDate)}
              onLabelChange={handleLabelChange}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
};

export default Timeline;
