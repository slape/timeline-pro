import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { EditableText, Box, Flex, IconButton, Icon } from '@vibe/core';
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
 * @param {Function} props.onRemove - Handler for removing the item
 * @returns {JSX.Element} - Draggable board item component
 */
const DraggableBoardItem = ({ item, date, shape = 'rectangle', onClick, onLabelChange, onRemove }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // Initialize size based on shape - circles should be square, ovals can be flexible
  const [size, setSize] = useState(() => {
    if (shape === 'circle') {
      return { width: 100, height: 100 };
    }
    return { width: 140, height: 30 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const itemColor = item.originalItem.group?.color || 'primary';

  // Format date as needed, e.g., "Jul 18, 2025"
  const formattedDate = date 
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
    : null;

  const shapeStyles = getShapeStyles(shape);

  // Force square dimensions for circle shapes
  useEffect(() => {
    if (shape === 'circle') {
      const currentSize = Math.min(size.width, size.height);
      if (size.width !== currentSize || size.height !== currentSize) {
        setSize({ width: currentSize, height: currentSize });
      }
    }
  }, [shape, size.width, size.height]);

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
      maxWidth={shape === 'circle' ? 120 : 200}
      maxHeight={shape === 'circle' ? 120 : 120}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          justifyContent: (shape === 'circle' || shape === 'oval') ? 'center' : 'space-between',
          alignItems: (shape === 'circle' || shape === 'oval') ? 'center' : 'stretch',
          overflow: 'visible',
        }}
        onClick={onClick}
      >

        {isHovered && onRemove && (
          <div
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the item's onClick
              onRemove(item.id);
            }}
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '16px',
              height: '16px',
              backgroundColor: 'rgba(200, 200, 200, 0.85)', // Light gray
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1000,
              border: '1px solid rgba(180, 180, 180, 0.9)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(200, 200, 200, 0.95)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(200, 200, 200, 0.85)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <span
              style={{
                fontSize: '15px',
                color: '#333', // Dark X for contrast against light gray
                fontWeight: 'bold',
                pointerEvents: 'none',
                lineHeight: 1,
                fontFamily: 'Arial, sans-serif',
                userSelect: 'none',
              }}
            >
              ×
            </span>
          </div>
        )}
        
        <div style={{ 
          fontSize: '0.75em', 
          fontWeight: '500',
          lineHeight: '1.3',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          flex: (shape === 'circle' || shape === 'oval') ? 'none' : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: (shape === 'circle' || shape === 'oval') ? '100%' : 'auto',
          height: (shape === 'circle' || shape === 'oval') ? '100%' : 'auto',
          // No transform needed for diamond with clip-path
          transform: 'none',
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
