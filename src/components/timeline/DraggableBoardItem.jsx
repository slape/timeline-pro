import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { EditableText, Box, Flex } from '@vibe/core';
import { getShapeStyles } from '../../functions/getShapeStyles';
import './DraggableBoardItem.css';

/**
 * DraggableBoardItem component that renders a draggable item from monday.com board
 * 
 * @param {Object} props - Component props
 * @param {Object} props.item - The board item data from monday.com
 * @param {string} props.item.id - Unique identifier for the item
 * @param {string} props.item.name - Name/title of the item
 * @param {Object} props.item.group - Group information for the item
 * @param {string} props.item.group.color - Color associated with the group
 * @param {string} props.shape - Shape of the item ('rectangle', 'circle', 'diamond')
 * @param {Function} props.onClick - Optional click handler
 * @param {Function} props.onLabelChange - Handler for label changes
 * @returns {JSX.Element} - Draggable board item component
 */
const DraggableBoardItem = ({ item, date, shape = 'rectangle', onClick, onLabelChange }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // Initialize size based on shape - circles should be square
  const [size, setSize] = useState(() => {
    if (shape === 'circle') {
      return { width: 100, height: 100 };
    }
    return { width: 140, height: 80 };
  });
  const [isDragging, setIsDragging] = useState(false);

  const itemColor = item.originalItem.group?.color || 'primary';

  // Format date as needed, e.g., "Jul 18, 2025"
  const formattedDate = date 
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
    : null;

  const shapeStyles = getShapeStyles(shape);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = (e, d) => {
    setPosition({ x: d.x, y: d.y });
    setIsDragging(false);
  };

  const handleResize = (e, direction, ref, delta, position) => {
    let newWidth = ref.offsetWidth;
    let newHeight = ref.offsetHeight;
    
    // For circle shapes, maintain square dimensions
    if (shape === 'circle') {
      const size = Math.min(newWidth, newHeight);
      newWidth = size;
      newHeight = size;
    }
    
    setSize({
      width: newWidth,
      height: newHeight,
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
      minWidth={shape === 'circle' ? 80 : 120}
      minHeight={shape === 'circle' ? 80 : 70}
      maxWidth={shape === 'circle' ? 150 : 200}
      maxHeight={shape === 'circle' ? 150 : 120}
      lockAspectRatio={shape === 'circle'}
    >
      <Box
        style={{
          opacity: isDragging ? 0.8 : 1,
          cursor: 'grab',
          padding: '8px',
          backgroundColor: itemColor,
          ...shapeStyles,
          boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.2s, opacity 0.2s',
          userSelect: 'none',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: shape === 'circle' ? 'center' : 'space-between',
          alignItems: shape === 'circle' ? 'center' : 'stretch',
          overflow: 'hidden',
        }}
        onClick={onClick}
      >
        <div style={{ 
          fontSize: '0.75em', 
          fontWeight: '500',
          lineHeight: '1.3',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          flex: shape === 'circle' ? 'none' : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: shape === 'circle' ? '100%' : 'auto',
          height: shape === 'circle' ? '100%' : 'auto',
          // Counter-rotate text for diamond shape to keep it readable
          transform: shape === 'diamond' ? 'rotate(-45deg)' : 'none',
        }}>
          <EditableText
            className='text-center'
            value={item.originalItem.name}
            onChange={(e) => onLabelChange?.(item.id, e.target.value)}
            multiline
          />
        </div>
      </Box>
    </Rnd>
  );
};

export default DraggableBoardItem;
