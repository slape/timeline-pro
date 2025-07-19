import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { EditableText, Box } from '@vibe/core';

/**
 * DraggableBoardItem component that renders a draggable item from monday.com board
 * 
 * @param {Object} props - Component props
 * @param {Object} props.item - The board item data from monday.com
 * @param {string} props.item.id - Unique identifier for the item
 * @param {string} props.item.name - Name/title of the item
 * @param {Object} props.item.group - Group information for the item
 * @param {string} props.item.group.color - Color associated with the group
 * @param {Function} props.onClick - Optional click handler
 * @param {Function} props.onLabelChange - Handler for label changes
 * @returns {JSX.Element} - Draggable board item component
 */
const DraggableBoardItem = ({ item, date, onClick, onLabelChange }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 300, height: 'auto' });
  const [isDragging, setIsDragging] = useState(false);

  const itemColor = item.group?.color || 'primary';

  // Format date as needed, e.g., "Jul 18, 2025"
  const formattedDate = date 
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
    : null;

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = (e, d) => {
    setPosition({ x: d.x, y: d.y });
    setIsDragging(false);
  };

  const handleResize = (e, direction, ref, delta, position) => {
    setSize({
      width: ref.offsetWidth,
      height: ref.offsetHeight,
    });
    setPosition(position);
  };

  return (
    <Rnd
      size={size}
      position={position}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResize={handleResize}
      bounds="parent"
      minWidth={200}
      minHeight={60}
    >
      <Box
        style={{
          opacity: isDragging ? 0.8 : 1,
          cursor: 'grab',
          padding: '8px 12px',
          backgroundColor: itemColor,
          borderRadius: '4px',
          boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.2s, opacity 0.2s',
          userSelect: 'none',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
        }}
        onClick={onClick}
      >
        <EditableText
          value={item.name}
          onChange={(e) => onLabelChange?.(item.id, e.target.value)}
        />
        
        {formattedDate && (
          <div style={{ fontSize: '0.6em', color: '#555', marginBottom: '4px' }}>
            {formattedDate}
          </div>
        )}
      </Box>
    </Rnd>
  );
};

export default DraggableBoardItem;
