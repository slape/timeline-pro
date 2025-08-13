import React, { useState, useEffect, useRef } from 'react';
import { EditableText, Box, DatePicker, Modal, Button, DialogContentContainer, Text, AlertBanner, AlertBannerText } from '@vibe/core';
import { getShapeStyles } from '../../functions/getShapeStyles';
import './DraggableBoardItem.css';
import { useZustandStore } from '../../store/useZustand';
import updateItemName from '../../functions/updateItemName';
import updateItemDate from '../../functions/updateItemDate';
import sanitizeItemName from '../../functions/sanitizeItemName';
import { applyPositionBounds } from '../../functions/resolveItemPositions';
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
    
    // Get timeline container dimensions dynamically
    const timelineContainer = document.querySelector('.timeline-container');
    if (!timelineContainer) {
      TimelineLogger.warn('Timeline container not found for bounds calculation');
      return;
    }
    
    const containerRect = timelineContainer.getBoundingClientRect();
    const itemRect = containerRef.current.getBoundingClientRect();
    
    // Calculate new position based on mouse movement
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    
    // Enhanced bounds calculation accounting for item size and timeline position
    const PADDING = 20; // Minimum padding from container edges
    const MAX_DRAG_DISTANCE = 300; // Maximum drag distance from timeline
    
    const itemWidth = itemRect.width;
    const itemHeight = itemRect.height;
    
    // Calculate timeline position within container (matches TimelineLine logic)
    const getTimelinePosition = (pos) => {
      switch (pos) {
        case 'above':
          return 0.25; // Timeline at 25% of container height
        case 'below':
          return 0.75; // Timeline at 75% of container height
        default:
          return 0.5; // Timeline at 50% of container height (center)
      }
    };
    
    const timelineRatio = getTimelinePosition(timelinePosition);
    const timelinePixelPosition = containerRect.height * timelineRatio;
    
    // Calculate position-aware Y bounds relative to timeline position
    const containerTop = 0;
    const containerBottom = containerRect.height;
    
    // Y bounds are relative to timeline position, with position-specific constraints
    let minYFromTimeline, maxYFromTimeline;
    
    if (timelinePosition === 'above') {
      // For 'above' position: timeline at 25%, limit downward movement more strictly
      minYFromTimeline = Math.max(containerTop - timelinePixelPosition, -MAX_DRAG_DISTANCE);
      // Reduce available space below timeline to prevent going too far down
      const availableSpaceBelow = containerBottom - timelinePixelPosition - 80; // 80px buffer from bottom
      maxYFromTimeline = Math.min(availableSpaceBelow, MAX_DRAG_DISTANCE * 0.7); // Reduce max distance for below
    } else if (timelinePosition === 'below') {
      // For 'below' position: timeline at 75%, allow more upward movement (100px higher)
      const availableSpaceAbove = timelinePixelPosition - containerTop - 20; // Reduced buffer from top
      minYFromTimeline = Math.max(-availableSpaceAbove, -MAX_DRAG_DISTANCE * 0.7); // Allow 100px upward (50% of 200px)
      maxYFromTimeline = Math.min(containerBottom - timelinePixelPosition, MAX_DRAG_DISTANCE);
    } else if (timelinePosition === 'alternate') {
      // For 'alternate' position: determine if THIS item is above or below the timeline
      // Check the item's current Y position to determine if it's above or below timeline
      const currentItemY = position.y;
      const isItemAboveTimeline = currentItemY < 0;
      
      // Debug logging to understand item positioning
      TimelineLogger.debug('Alternate bounds calculation', {
        itemId: item.id,
        currentItemY,
        isItemAboveTimeline,
        timelinePixelPosition,
        containerHeight: containerRect.height
      });
      
      if (isItemAboveTimeline) {
        // Item is above timeline - limit upward movement, allow downward to timeline
        const availableSpaceAbove = timelinePixelPosition - containerTop - 20; // Buffer from top
        minYFromTimeline = Math.max(-availableSpaceAbove, -MAX_DRAG_DISTANCE * 0.7); // Limit upward movement
        maxYFromTimeline = Math.min(50, MAX_DRAG_DISTANCE); // Allow movement down to near timeline
      } else {
        // Item is below timeline - limit downward movement, allow upward to timeline  
        minYFromTimeline = Math.max(-50, -MAX_DRAG_DISTANCE); // Allow movement up to near timeline
        const availableSpaceBelow = containerBottom - timelinePixelPosition - 20; // Buffer from bottom
        maxYFromTimeline = Math.min(availableSpaceBelow, MAX_DRAG_DISTANCE * 0.6); // More restrictive for below items
      }
    } else {
      // For 'center' position: use full drag distance in both directions
      minYFromTimeline = Math.max(containerTop - timelinePixelPosition, -MAX_DRAG_DISTANCE);
      maxYFromTimeline = Math.min(containerBottom - timelinePixelPosition, MAX_DRAG_DISTANCE);
    }
    
    // Calculate proper bounds accounting for item size and timeline position
    const bounds = {
      minX: PADDING,
      maxX: containerRect.width - itemWidth - PADDING,
      minY: minYFromTimeline,
      maxY: maxYFromTimeline
    };
    
    TimelineLogger.debug('Position-aware bounds calculated', {
      timelinePosition,
      timelineRatio,
      timelinePixelPosition,
      containerHeight: containerRect.height,
      bounds,
      itemId: item.id
    });
    
    // Calculate new X position as absolute pixels within timeline container
    const containerLeft = containerRect.left;
    const mouseXInContainer = e.clientX - containerLeft;
    const boundedMouseX = Math.max(bounds.minX + itemWidth/2, Math.min(mouseXInContainer, bounds.maxX + itemWidth/2));
    
    // Convert to percentage of timeline container width
    const newX = (boundedMouseX / containerRect.width) * 100;
    
    // Calculate new Y position with enhanced bounds checking
    const proposedY = dragOffset.current.y + dy;
    const boundedY = Math.max(bounds.minY, Math.min(proposedY, bounds.maxY));
    
    // Log bounds enforcement if position was adjusted
    if (boundedY !== proposedY || Math.abs(boundedMouseX - mouseXInContainer) > 1) {
      TimelineLogger.debug('Draggable bounds enforced', {
        itemId: item.id,
        proposed: { x: (mouseXInContainer / containerRect.width) * 100, y: proposedY },
        bounded: { x: newX, y: boundedY },
        bounds,
        containerSize: { width: containerRect.width, height: containerRect.height },
        itemSize: { width: itemWidth, height: itemHeight }
      });
    }
    
    // Update position with bounded values
    setPosition({
      x: newX,
      y: boundedY
    });
    
    // Notify parent of position change if callback is provided
    if (onPositionChange) {
      onPositionChange(item.id, {
        x: newX,
        y: boundedY
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
  const handleSaveDate = async () => {
    try {
      TimelineLogger.debug('🎯 handleSaveDate called', { 
        itemId: item.id, 
        selectedDate: selectedDate,
        selectedDateType: typeof selectedDate,
        isMoment: moment.isMoment(selectedDate)
      });
      
      if (!selectedDate) {
        TimelineLogger.warn('No date selected', { itemId: item.id });
        return;
      }
      
      // Convert moment to Date if needed
      const dateToUpdate = moment.isMoment(selectedDate) ? selectedDate.toDate() : selectedDate;
      
      TimelineLogger.debug('🎯 Date conversion completed', { 
        itemId: item.id, 
        originalSelectedDate: selectedDate,
        dateToUpdate: dateToUpdate,
        dateToUpdateType: typeof dateToUpdate
      });
    
      // Extract date column ID (handle both string and object formats)
      let dateColumnId;
      if (settings?.dateColumn) {
        if (typeof settings.dateColumn === 'string') {
          dateColumnId = settings.dateColumn;
        } else if (typeof settings.dateColumn === 'object') {
          // Handle object format like { date_column_id: true }
          const keys = Object.keys(settings.dateColumn);
          dateColumnId = keys.length === 1 ? keys[0] : undefined;
        }
      }
      
      if (!dateColumnId) {
        TimelineLogger.error('Cannot update item date: date column not available', { 
          itemId: item.id, 
          newDate: dateToUpdate,
          dateColumn: settings?.dateColumn,
          dateColumnType: typeof settings?.dateColumn
        });
        return;
      }
      
      // Get column type from the item's column_values data
      let columnType = 'date'; // Default fallback
      let currentColumnValue = null; // Store the current column value for timeline updates
      
      TimelineLogger.debug('Column type detection debug', {
        itemId: item.id,
        dateColumnId: dateColumnId,
        hasOriginalItem: !!item?.originalItem,
        hasColumnValues: !!item?.originalItem?.column_values,
        columnValuesCount: item?.originalItem?.column_values?.length || 0,
        allColumnIds: item?.originalItem?.column_values?.map(col => ({ id: col.id, type: col.type })) || []
      });
      
      if (item?.originalItem?.column_values) {
        const columnValue = item.originalItem.column_values.find(col => col.id === dateColumnId);
        TimelineLogger.debug('Found column value for date column', {
          dateColumnId: dateColumnId,
          foundColumn: !!columnValue,
          columnId: columnValue?.id,
          columnType: columnValue?.type,
          columnValue: columnValue,
          columnValueText: columnValue?.text,
          columnValueValue: columnValue?.value,
          columnValueParsed: columnValue?.value ? JSON.parse(columnValue.value) : null
        });
        
        if (columnValue?.type) {
          columnType = columnValue.type;
          currentColumnValue = columnValue; // Store for timeline updates
        }
      }
      
      if (!context?.boardId) {
        TimelineLogger.error('Cannot update item date: board ID not available', { 
          itemId: item.id, 
          newDate: dateToUpdate 
        });
        return;
      }
      
      TimelineLogger.debug('Updating item date - DraggableBoardItem', {
        itemId: item.id,
        boardId: context.boardId,
        dateColumn: settings.dateColumn,
        dateColumnId: dateColumnId,
        columnType: columnType,
        dateColumnType: typeof settings.dateColumn,
        oldDate: date,
        newDate: dateToUpdate,
        selectedDate: selectedDate,
        selectedDateType: typeof selectedDate,
        momentCheck: moment.isMoment(selectedDate),
        settings: settings,
        context: context
      });
      
      const result = await updateItemDate(monday, item.id, context.boardId, dateColumnId, dateToUpdate, columnType, null, currentColumnValue);
      
      TimelineLogger.debug('updateItemDate result', {
        itemId: item.id,
        result: result,
        success: result.success,
        error: result.error
      });
      
      if (result.success) {
        TimelineLogger.debug('Item date updated successfully', {
          itemId: item.id,
          newDate: dateToUpdate
        });
        
        // Close the date picker modal
        setIsDatePickerOpen(false);
        setSelectedDate(null);
        
        // Update the local board item data in the zustand store
        // This will cause the timeline to re-render automatically with the new date
        
        // Convert dateToUpdate to YYYY-MM-DD format for the column value
        let dateString;
        if (dateToUpdate instanceof Date) {
          const year = dateToUpdate.getUTCFullYear();
          const month = String(dateToUpdate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(dateToUpdate.getUTCDate()).padStart(2, '0');
          dateString = `${year}-${month}-${day}`;
        } else if (typeof dateToUpdate === 'string') {
          dateString = dateToUpdate;
        } else {
          TimelineLogger.error('Invalid date format for local store update', { dateToUpdate });
          return;
        }
        
        const newColumnValue = columnType === 'timeline' 
          ? JSON.stringify({ from: currentColumnValue?.value ? JSON.parse(currentColumnValue.value).from : null, to: dateString })
          : JSON.stringify({ date: dateString });
          
        updateBoardItemDate(item.id, dateColumnId, newColumnValue);
        
        TimelineLogger.debug('Updated local board item data, timeline should re-render automatically', {
          itemId: item.id,
          columnId: dateColumnId,
          newDate: dateToUpdate,
          newColumnValue: newColumnValue
        });
        
        // Optionally trigger a callback to refresh timeline data
        // This could be passed as a prop if needed
        onLabelChange?.(item.id, dateToUpdate);
      } else {
        TimelineLogger.error('Failed to update item date', {
          itemId: item.id,
          newDate: dateToUpdate,
          error: result.error
        });
        
        // You might want to show a toast notification or revert the change
        // For now, we'll just log the error
      }
      
    } catch (error) {
      TimelineLogger.error('🚨 Exception in handleSaveDate', {
        itemId: item.id,
        error: error.message,
        stack: error.stack,
        selectedDate: selectedDate,
        settings: settings,
        context: context
      });
      
      // Close modal on error to prevent it from being stuck open
      setIsDatePickerOpen(false);
      setSelectedDate(null);
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
                onClick={handleSaveDate}
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
