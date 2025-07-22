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
 * @param {Date} props.date - Date associated with the item
 * @param {string} props.shape - Shape of the item ('rectangle', 'circle')
 * @param {Function} props.onClick - Optional click handler
 * @param {Function} props.onLabelChange - Handler for label changes
 * @param {Function} props.onRemove - Handler for removing the item
 * @param {boolean} props.showItemDates - Whether to show editable date text
 * @returns {JSX.Element} - Draggable board item component
 */
const DraggableBoardItem = ({ item, date, shape = 'rectangle', onClick, onLabelChange, onRemove, showItemDates = false }) => {
  // Initialize size based on shape - circles should be square, ovals can be flexible
  const [size, setSize] = useState(() => ({
    width: shape === 'circle' ? 100 : 140,
    height: shape === 'circle' ? 100 : (showItemDates ? 50 : 30)
  }));
  
  // Calculate position based on center alignment with fine-tuned offset
  const calculateCenterOffset = (currentWidth) => {
    const baseOffset = -(currentWidth / 2);
    // Fine-tune offset for pixel-perfect alignment
    // This accounts for any padding/margin/border that might affect the visual center
    const fineTuneOffset = shape === 'circle' ? 0 : 0;
    return { x: baseOffset + fineTuneOffset, y: 0 };
  };
  
  const [position, setPosition] = useState(() => calculateCenterOffset(shape === 'circle' ? 100 : 140));
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const itemColor = item.originalItem.group?.color || 'primary';

  // Format date as needed, e.g., "Jul 18, 2025"
  const formattedDate = date 
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'short'}).format(date)
    : null;

  const shapeStyles = getShapeStyles(shape);

  // Update position and size when shape or showItemDates changes
  useEffect(() => {
    const newWidth = shape === 'circle' ? 100 : 140;
    const newHeight = shape === 'circle' ? 100 : (showItemDates ? 50 : 30);
    
    setSize({
      width: newWidth,
      height: newHeight
    });
    
    setPosition(calculateCenterOffset(newWidth));
  }, [shape, showItemDates]);

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
      minHeight={shape === 'circle' ? 80 : 80}
      maxWidth={shape === 'circle' ? 120 : 200}
      maxHeight={shape === 'circle' ? 120 : 120}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        className={shape === 'circle' ? 'circle-shape' : ''}
        style={{
          opacity: isDragging ? 0.8 : 1,
          cursor: 'grab',
          backgroundColor: itemColor,
          ...shapeStyles,
          boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.2s, opacity 0.2s',
          userSelect: 'none',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        onClick={onClick}
      >

        {isHovered && onRemove && (
          <div
            onMouseDown={(e) => {
              e.stopPropagation(); // Prevent Rnd from capturing the event
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the item's onClick
              e.preventDefault(); // Prevent default behavior
              // console.log('Remove button clicked for item:', item.id);
              onRemove(item.id);
            }}
            onPointerDown={(e) => {
              e.stopPropagation(); // Additional event prevention for touch devices
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
              zIndex: 1001, // Higher z-index for diamond shapes
              border: '1px solid rgba(180, 180, 180, 0.9)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto', // Ensure pointer events are enabled
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
        
        <div className="text-center" style={{ width: '100%', height: '100%' }}>
          <div style={{
            width: '100%',
            fontSize: '0.75em',
            fontWeight: '500',
            wordBreak: 'break-word',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical'
          }}>
            <EditableText
              value={item.originalItem.name}
              style={{
                width: '100%',
                textAlign: 'center',
                display: 'inline-block'
              }}
              multiline
            />
          </div>
          
          {showItemDates && (
            <div style={{
              width: '100%',
              marginTop: '4px',
              textAlign: 'center',
              fontSize: '0.7em',
              lineHeight: '1.1',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '0 2px'
            }}>
              <EditableText
                className='text-center'
                value={formattedDate}
                style={{
                  width: '100%',
                  whiteSpace: 'normal',
                  overflow: 'visible',
                  textOverflow: 'clip'
                }}
              />
            </div>
          )}
        </div>
      </Box>
    </Rnd>
  );
};

export default DraggableBoardItem;
