import React, { useState, useEffect, useRef } from "react";
import TimelineLogger from "../../utils/logger";
import DatePickerModal from "./DatePickerModal";
import ItemContainer from "./ItemContainer";
import { getContainerStyles } from "../../functions/draggableItemStyles";
import { getShapeStyles } from "../../functions/getShapeStyles";
import "./DraggableBoardItem.css";
import { useDraggableItemState } from "../../hooks/useDraggableItemState";
import { useDateHandling } from "../../hooks/useDateHandling";
import { useMouseHandlers } from "../../hooks/useMouseHandlers";
import { useIsolatedZustandState } from "../../hooks/useIsolatedZustandState";
import { getItemColor } from "../../functions/itemColorUtils";
import { calculateInitialSize } from "../../functions/itemSizeUtils";
import handleItemNameChange from "../../functions/handleItemNameChange";
import handleSaveDate from "../../functions/handleSaveDate";
import mondaySdk from "monday-sdk-js";

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
  onPositionChange,
}) => {
  // Use custom hook for draggable item state management
  const {
    position,
    setPosition,
    isDragging,
    setIsDragging,
    isHovered,
    setIsHovered,
    dragStartPos,
    dragOffset,
    startSize,
    itemRef,
    containerRef,
  } = useDraggableItemState();

  // Use custom hook for date handling
  const { getFormattedDate } = useDateHandling(date);

  // Extract required data from props and store with stable references
  // Use a custom hook to isolate the state access and reduce rerenders
  const { context, settings, updateBoardItemDate } = useIsolatedZustandState(
    item.id,
  );

  // Extract position values for easier access and stability

  // Create a stable reference to the position data to prevent child component rerenders
  // Use primitive values as dependencies to avoid reference issues
  const elRef = useRef(null);
  // Initialize size using utility function
  const [size, setSize] = useState(() =>
    calculateInitialSize(shape, showItemDates, true),
  );

  // Date picker state - using React.useState for more explicit reference
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(null);

  // Date picker handlers - using React.useCallback to prevent recreation on re-renders
  const openDatePicker = React.useCallback((date) => {
    // Just pass the date directly - the DatePickerModal will handle conversion
    setSelectedDate(date);
    setIsDatePickerOpen(true);
  }, []);

  const closeDatePicker = React.useCallback(() => {
    setIsDatePickerOpen(false);
    // Also reset the selected date when closing to avoid stale state
    setSelectedDate(null);
  }, []);

  const handleDateChange = React.useCallback((newDate) => {
    // The DatePicker component will pass a moment object here
    setSelectedDate(newDate);
  }, []);

  // Calculate initial position based on the item's date - only runs on mount
  useEffect(() => {
    if (itemRef.current && containerRef.current) {
      // Center the item horizontally by default (50% of the container)
      const initialX = 50;
      setPosition((prev) => ({
        x: initialX,
        y: prev.y,
      }));
    }
  }, []); // Only run once on mount, size changes shouldn't affect this

  // Get item color using utility function
  const itemColor = getItemColor(item);

  // Format date using hook utility
  const formattedDate = getFormattedDate(date);

  // Memoize shape styles to prevent unnecessary recalculations
  const shapeStyles = React.useMemo(() => getShapeStyles(shape), [shape]);

  // Update size when shape or showItemDates changes
  // Memoize the size calculation to prevent unnecessary updates
  const calculatedSize = React.useMemo(
    () => calculateInitialSize(shape, showItemDates),
    [shape, showItemDates],
  );

  // Update size state only when the calculated size changes
  useEffect(() => {
    setSize(calculatedSize);
  }, [calculatedSize]);

  // Memoize container styles to prevent unnecessary recalculations
  const containerStyles = React.useMemo(
    () => getContainerStyles(position, size, isDragging),
    [position, size, isDragging],
  );

  // Create a stable callback for position changes
  const handlePositionChange = React.useCallback(
    (id, pos, isDragEnd) => {
      if (onPositionChange) {
        // Use a timeout to break the update cycle
        setTimeout(() => {
          onPositionChange(id, pos, isDragEnd);

          // IMPORTANT: Update connector anchor directly at the end of drag
          if (isDragEnd) {
            // Update the connector anchor directly
            const connectorAnchor = document.getElementById(`board-item-${id}`);
            if (connectorAnchor) {
              // Set the transform directly
              connectorAnchor.style.transform = `translateY(${pos.y}px)`;
              // Store the final position in data attributes
              connectorAnchor.dataset.finalPosition = pos.y;
              connectorAnchor.dataset.positionY = pos.y;
            }

            // Dispatch events for connector updates
            const updateEvent = new CustomEvent(
              "timeline-item-position-final",
              {
                bubbles: true,
                detail: { itemId: id, position: pos },
              },
            );
            document.dispatchEvent(updateEvent);

            // Also trigger a standard position change event
            const posChangeEvent = new CustomEvent(
              "timeline-position-changed",
              {
                bubbles: true,
                detail: { itemId: id, isDragEnd: true, finalY: pos.y },
              },
            );
            document.dispatchEvent(posChangeEvent);

            // Add a delayed update to ensure connector stays synchronized
            setTimeout(() => {
              if (connectorAnchor) {
                connectorAnchor.style.transform = `translateY(${pos.y}px)`;
              }
            }, 50);
          }
        }, 10);
      }
    },
    [onPositionChange],
  );

  // Memoize the handler config to prevent recreation on every render
  const handlerConfig = React.useMemo(
    () => ({
      containerRef,
      dragStartPos,
      dragOffset,
      startSize,
      position,
      setPosition,
      size,
      setSize,
      setIsDragging,
      setIsResizing: () => {}, // No-op since we don't track resizing state
      onPositionChange: handlePositionChange,
      item,
      timelinePosition: settings?.position,
    }),
    [
      position,
      setPosition,
      size,
      setSize,
      setIsDragging,
      position.x,
      position.y,
      size.width,
      size.height,
      settings?.position,
      item?.id,
      handlePositionChange,
    ],
  );

  // Use custom hook for mouse handlers with memoized config
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeMouseDown,
  } = useMouseHandlers(handlerConfig);

  // Clean up event listeners on unmount or when handlers change
  // Use a stable cleanup function to avoid dependency issues
  const cleanup = React.useCallback(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Create a stable mouseDown handler
  const itemMouseDown = React.useCallback(
    (e) => {
      // Always stop propagation first to prevent parent elements from moving
      e.stopPropagation();

      // Always prevent default browser behavior
      e.preventDefault();

      // Prevent accidental movements by checking if this is a simple click vs drag
      if (e.type === "click") {
        // For click events, don't trigger drag behavior
        return;
      }

      TimelineLogger.debug(
        "[DRAG-DEBUG] handleMouseDown fired in ItemContainer",
        { itemId: item.id },
      );
      handleMouseDown(e);
    },
    [handleMouseDown, item.id],
  );

  // Handle item name change
  const handleNameChange = async (newName) => {
    await handleItemNameChange({
      newName,
      item,
      context,
      monday,
      onLabelChange,
    });
  };

  // Handle opening the date picker modal
  const handleOpenDatePicker = () => {
    openDatePicker(date);
  };

  // Handle saving the selected date
  const handleSaveDateWrapper = React.useCallback(
    async (dateToSave) => {
      try {
        // Use the date passed from the modal
        await handleSaveDate({
          item,
          selectedDate: dateToSave, // Use the date from the modal
          settings,
          context,
          monday,
          updateBoardItemDate,
          setIsDatePickerOpen,
          setSelectedDate,
          onLabelChange,
          date,
        });

        // Success! Modal will be closed by the DatePickerModal component
        return true;
      } catch (error) {
        console.error("Error saving date:", error);
        // Return false to indicate failure, but the modal will still close
        return false;
      }
    },
    [item, settings, context, monday, updateBoardItemDate, onLabelChange, date],
  );

  return (
    <div
      ref={(el) => {
        itemRef.current = el;
        elRef.current = el; // Set both refs to the same element
        // Also set the container ref when the element mounts/updates
        if (el) {
          containerRef.current = el.closest(".timeline-container");
        }
      }}
      className={`draggable-board-item ${isDragging ? "dragging" : ""}`}
      data-id={item.id}
      data-item-id={item.id}
      style={{
        ...containerStyles,
        // Ensure the draggable item doesn't move with its parent
        position: "absolute",
        willChange: "transform",
        // Ensure it receives mouse events
        pointerEvents: "auto",
        // Make sure it's on top when dragging
        zIndex: isDragging ? 1000 : containerStyles.zIndex || 1,
        // Use GPU acceleration for smoother dragging
        transform: containerStyles.transform || "translateX(-50%)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(e) => {
        // Stop propagation and prevent default to keep events contained
        e.stopPropagation();
        e.preventDefault();
        // Add a custom flag to this event to mark it as handled by our draggable item
        e.nativeEvent._handledByDraggableItem = true;
        itemMouseDown(e);
      }}
    >
      <ItemContainer
        shape={shape}
        isDragging={isDragging}
        itemColor={itemColor}
        shapeStyles={shapeStyles}
        onClick={(e) => {
          // Prevent click event from triggering dragging behavior
          e.stopPropagation();
          if (onClick) onClick(e);
        }}
        isHovered={isHovered}
        onHideItem={onHideItem}
        item={item}
        handleResizeMouseDown={handleResizeMouseDown}
        showItemDates={showItemDates}
        formattedDate={formattedDate}
        handleNameChange={handleNameChange}
        handleMouseDown={itemMouseDown}
        handleOpenDatePicker={handleOpenDatePicker}
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={closeDatePicker}
        item={item}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onSave={handleSaveDateWrapper}
      />
    </div>
  );
};

export default React.memo(DraggableBoardItem);
