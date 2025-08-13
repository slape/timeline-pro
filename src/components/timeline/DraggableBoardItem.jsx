import React, { useState, useEffect, useRef } from 'react';
import { EditableText, Box, DatePicker, Modal, Button, DialogContentContainer, Text, AlertBanner, AlertBannerText } from '@vibe/core';
import { getShapeStyles } from '../../functions/getShapeStyles';
import './DraggableBoardItem.css';
import { useZustandStore } from '../../store/useZustand';
import updateItemDate from '../../functions/updateItemDate';
import handleItemNameChange from '../../functions/handleItemNameChange';
import handleSaveDate from '../../functions/handleSaveDate';
import { applyPositionBounds } from '../../functions/resolveItemPositions';
import {
  createHandleMouseDown,
  createHandleMouseMove,
  createHandleMouseUp,
  createHandleResizeMouseDown,
  createHandleResizeMouseMove,
  createHandleResizeMouseUp
} from '../../functions/draggableMouseHandlers';
import mondaySdk from 'monday-sdk-js';
import TimelineLogger from '../../utils/logger';
import moment from 'moment';

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
  
  // Get context, settings, and store methods from zustand store for board ID, date column, and timeline refresh
  const { 
    settings, 
    context, 
    updateBoardItemDate
  } = useZustandStore();
  
  // Get position setting for bounds calculation
  const timelinePosition = settings?.position || 'below';
  
  // State for date picker modal
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

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

  // Create mouse handlers using extracted functions
  const handleMouseMove = React.useMemo(() => createHandleMouseMove({
    containerRef,
    dragStartPos,
    dragOffset,
    position,
    setPosition,
    onPositionChange,
    item,
    timelinePosition
  }), [position, onPositionChange, item, timelinePosition]);

  const handleMouseUp = React.useMemo(() => createHandleMouseUp({
    setIsDragging,
    handleMouseMove,
    handleMouseUp: () => {}, // Will be set by the function itself
    onPositionChange,
    item,
    position
  }), [handleMouseMove, onPositionChange, item, position]);

  const handleMouseDown = React.useMemo(() => createHandleMouseDown({
    dragStartPos,
    dragOffset,
    setIsDragging,
    handleMouseMove,
    handleMouseUp
  }), [handleMouseMove, handleMouseUp]);

  const handleResizeMouseMove = React.useMemo(() => createHandleResizeMouseMove({
    dragStartPos,
    startSize,
    setSize
  }), []);

  const handleResizeMouseUp = React.useMemo(() => createHandleResizeMouseUp({
    setIsResizing,
    handleResizeMouseMove,
    handleResizeMouseUp: () => {} // Will be set by the function itself
  }), [handleResizeMouseMove]);

  const handleResizeMouseDown = React.useMemo(() => createHandleResizeMouseDown({
    dragStartPos,
    startSize,
    size,
    setIsResizing,
    handleResizeMouseMove,
    handleResizeMouseUp
  }), [size, handleResizeMouseMove, handleResizeMouseUp]);
  
  // Handle item name change
  const handleNameChange = async (newName) => {
    await handleItemNameChange({
      newName,
      item,
      context,
      monday,
      onLabelChange
    });
  };
  
  // Handle date picker selection
  const handleDatePickerChange = (newDate) => {
    setSelectedDate(newDate);
  };
  
  // Handle opening the date picker modal
  const handleOpenDatePicker = () => {
    // Initialize selected date with current date
    setSelectedDate(date ? moment(date) : moment());
    setIsDatePickerOpen(true);
  };
  
  // Handle saving the selected date
  const handleSaveDateWrapper = () => {
    return handleSaveDate({
      item,
      selectedDate,
      settings,
      context,
      monday,
      updateBoardItemDate,
      setIsDatePickerOpen,
      setSelectedDate,
      onLabelChange,
      date
    });
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
              <Text
                element="div"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDatePicker();
                }}
                style={{
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  transition: 'background-color 0.2s',
                  fontSize: 'inherit',
                  lineHeight: 'inherit'
                }}
                onMouseDown={e => e.stopPropagation()}
              >
                {formattedDate || 'Click to set date'}
              </Text>
            </div>
          )}
        </div>
        </Box>
      </div>
      
      {/* Date Picker Modal */}
      {isDatePickerOpen && (
        <Modal
          show={isDatePickerOpen}
          onClose={() => {
            setIsDatePickerOpen(false);
            setSelectedDate(null);
          }}
          title={
            <Text size="text-size-medium" weight="medium">
              Change Date: {item?.originalItem?.name || 'Item'}
            </Text>
          }
          size="small"
          width="400px"
        >
          <DialogContentContainer>
            <DatePicker
              date={selectedDate}
              onPickDate={handleDatePickerChange}
              firstDayOfWeek={1}
              data-testid="date-picker"
            />
            <AlertBanner
              isCloseHidden={true}
            >
            <AlertBannerText
              text="Changing this date will update your board."
            />
            </AlertBanner>
            <div style={{ 
              marginTop: '16px', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '8px' 
            }}>
              <Button
                onClick={() => {
                  setIsDatePickerOpen(false);
                  setSelectedDate(null);
                }}
                kind="tertiary"
                size="small"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDateWrapper}
                kind="primary"
                disabled={!selectedDate}
                size="small"
              >
                Save Date
              </Button>
            </div>
          </DialogContentContainer>
        </Modal>
      )}
    </div>
  );
};

export default DraggableBoardItem;
