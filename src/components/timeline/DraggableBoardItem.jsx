import React, { useState, useEffect, useRef } from 'react';
import { EditableText, Box } from '@vibe/core';
import { getShapeStyles } from '../../functions/getShapeStyles';
import './DraggableBoardItem.css';
import { useZustandStore } from '../../store/useZustand';
import updateItemName from '../../functions/updateItemName';
import sanitizeItemName from '../../functions/sanitizeItemName';
import mondaySdk from 'monday-sdk-js';
import TimelineLogger from '../../utils/logger';

const monday = mondaySdk();

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
 * @param {Function} props.onHideItem - Handler for hiding the item
 * @param {boolean} props.showItemDates - Whether to show editable date text
 * @param {Function} props.onPositionChange - Callback when item position changes (id, {x, y})
 * @returns {JSX.Element} - Draggable board item component
 */
const DraggableBoardItem = ({ 
  onClick,
  item,
  date,
  shape,
  onLabelChange, 
  onHideItem, 
  showItemDates,
  onPositionChange // New prop for notifying position changes
}) => {  
  // Position and drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const itemRef = useRef(null);
  const containerRef = useRef(null);
  // Timeline items are processed objects; original monday item is nested under originalItem
  const { id } = item;
  const groupColor = item?.originalItem?.group?.color;
  
  // Get context from zustand store for board ID
  const { context } = useZustandStore();

  // Initialize size based on shape - circles should be square, ovals can be flexible
  const [size, setSize] = useState(() => ({
    width: shape === 'circle' ? 100 : 140,
    height: shape === 'circle' ? 100 : (showItemDates ? 50 : 30)
  }));

  // Calculate initial position based on the item's date
  useEffect(() => {
    if (itemRef.current && containerRef.current) {
      // Center the item horizontally by default (50% of the container)
      const initialX = 50;
      setPosition(prev => ({
        x: initialX,
        y: prev.y
      }));
    }
  }, [size.width]);

  // Use the monday group color for background; fall back to theme primary color
  const itemColor = groupColor || 'var(--primary-color)';

  // Format date as needed, e.g., "Jul 18, 2025"
  const isValidDate = (d) => d instanceof Date && !isNaN(d);
  const formattedDate = isValidDate(date)
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(date)
    : null;

  const shapeStyles = getShapeStyles(shape);

  // Update size when shape or showItemDates changes
  useEffect(() => {
    const newWidth = shape === 'circle' ? 100 : 140; // Doubled rectangle width from 140 to 280
    const newHeight = shape === 'circle' ? 100 : (showItemDates ? 80 : 60);
    
    setSize({
      width: newWidth,
      height: newHeight
    });
  }, [shape, showItemDates]);

  const handleMouseDown = (e) => {
    // Only start drag on primary mouse button
    if (e.button !== 0) return;
    
    // Prevent text selection during drag
    e.preventDefault();
    
    // Save initial position
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { ...position };
    
    // Set up event listeners for drag
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp, { once: true });
    
    setIsDragging(true);
  };
  
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    // Get container bounds to calculate relative position
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerLeft = containerRect.left;
    const containerWidth = containerRect.width;
    
    // Calculate new position based on mouse movement
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    
    // Calculate new X position as a percentage of container width
    // Clamp the position to stay within the container bounds (with 10% padding on each side)
    const minX = (10 / 100) * containerWidth; // 10% from left
    const maxX = containerWidth - minX; // 10% from right
    const containerX = Math.max(minX, Math.min(e.clientX - containerLeft, maxX));
    const newX = ((containerX - minX) / (maxX - minX)) * 100; // Convert to 0-100% range within bounds
    
    // Calculate the new Y position with bounds checking
    const newY = dragOffset.current.y + dy;
    
    // Update position with both X and Y changes
    setPosition({
      x: newX, // Now using 0-100% range
      y: newY
    });
    
    // Notify parent of position change if callback is provided
    if (onPositionChange) {
      onPositionChange(item.id, {
        x: newX, // Absolute percentage position (0-100%)
        y: newY
      });
    }
  };
  
  const handleResizeMouseDown = (e) => {
    // Only start resize on primary mouse button
    if (e.button !== 0) return;
    
    e.stopPropagation();
    
    // Save initial position and size
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { width: size.width, height: size.height };
    
    // Set up event listeners for resize
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp, { once: true });
    
    setIsResizing(true);
  };
  
  const handleResizeMouseMove = (e) => {
    // Calculate new size based on mouse movement
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    
    // Minimum size constraints
    const minSize = 50;
    const newWidth = Math.max(minSize, startSize.current.width + dx);
    const newHeight = Math.max(minSize, startSize.current.height + dy);
    
    setSize({
      width: newWidth,
      height: newHeight
    });
  };
  
  const handleResizeMouseUp = () => {
    // Clean up event listeners
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
    
    setIsResizing(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Notify parent of position change
    onPositionChange?.(item.id, position);
  };
  
  // Handle item name change
  const handleNameChange = async (newName) => {
    if (!newName || newName.trim() === '') {
      TimelineLogger.warn('Attempted to set empty item name', { itemId: item.id });
      return;
    }
    
    const trimmedName = newName.trim();
    const sanitizedName = sanitizeItemName(trimmedName);
    
    // Check if sanitization resulted in an empty string
    if (!sanitizedName) {
      TimelineLogger.warn('Item name became empty after sanitization', { 
        itemId: item.id, 
        originalName: newName,
        trimmedName 
      });
      return;
    }
    
    // Don't update if the name hasn't actually changed
    if (sanitizedName === item?.originalItem?.name) {
      return;
    }
    
    if (!context?.boardId) {
      TimelineLogger.error('Cannot update item name: board ID not available', { 
        itemId: item.id, 
        newName: sanitizedName 
      });
      return;
    }
    
    TimelineLogger.debug('Updating item name', {
      itemId: item.id,
      boardId: context.boardId,
      oldName: item?.originalItem?.name,
      originalInput: newName,
      sanitizedName: sanitizedName
    });
    
    const result = await updateItemName(monday, item.id, context.boardId, sanitizedName);
    
    if (result.success) {
      TimelineLogger.debug('Item name updated successfully', {
        itemId: item.id,
        newName: sanitizedName
      });
      
      // Optionally trigger a callback to refresh board data
      // This could be passed as a prop if needed
      onLabelChange?.(item.id, sanitizedName);
    } else {
      TimelineLogger.error('Failed to update item name', {
        itemId: item.id,
        newName: sanitizedName,
        error: result.error
      });
      
      // You might want to show a toast notification or revert the change
      // For now, we'll just log the error
    }
  };

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={el => {
        itemRef.current = el;
        // Also set the container ref when the element mounts/updates
        if (el) {
          containerRef.current = el.closest('.timeline-container');
        }
      }}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 'auto',
        transform: 'translateX(-50%)', // Center the item horizontally
        transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease, left 0.2s ease',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}>
        <Box
          className={shape === 'circle' ? 'circle-shape' : ''}
          style={{
            opacity: isDragging ? 0.8 : 1,
            cursor: 'grab',
            backgroundColor: itemColor,
            ...shapeStyles,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: isDragging 
              ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)' 
              : '0 2px 6px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)',
            transition: 'box-shadow 0.2s, opacity 0.2s, border-color 0.2s',
            userSelect: 'none',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'visible' // Allow button to overflow
          }}
          onClick={onClick}
        >

        {/* Remove button container - positioned outside the main shape */}
        <div style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          width: '20px',
          height: '20px',
          display: isHovered && onHideItem ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          pointerEvents: 'auto',
          transform: 'translateZ(0)' // Force hardware acceleration
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHideItem?.(item.id);
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#fff',
              border: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              outline: 'none',
              position: 'relative',
              zIndex: 1002
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <span style={{
              display: 'block',
              width: '12px',
              height: '12px',
              position: 'relative',
              pointerEvents: 'none'
            }}>
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '12px',
                height: '2px',
                background: '#333',
                margin: '-1px -6px',
                transform: 'rotate(45deg)'
              }} />
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '12px',
                height: '2px',
                background: '#333',
                margin: '-1px -6px',
                transform: 'rotate(-45deg)'
              }} />
            </span>
          </button>
        </div>
        
        {/* Resize Handle */}
        <div 
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '16px',
            height: '16px',
            cursor: 'nwse-resize',
            zIndex: 1001,
            pointerEvents: 'auto',
            background: 'transparent',
            opacity: 0
          }}
        />
        
        <div 
          className="text-center"
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'relative',
            zIndex: 1,
            userSelect: 'none' // Prevent text selection during drag
          }}
          onMouseDown={handleMouseDown}
        >
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
              value={item?.originalItem?.name}
              onChange={handleNameChange}
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
      </div>
    </div>
  );
};

export default DraggableBoardItem;
