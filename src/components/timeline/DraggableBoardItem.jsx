import React, { useState, useEffect } from "react";
import TimelineLogger from "../../utils/logger";
import DatePickerModal from "./DatePickerModal";
import ItemContainer from "./ItemContainer";
import { getContainerStyles } from "../../functions/draggableItemStyles";
import { getShapeStyles } from "../../functions/getShapeStyles";
import "./DraggableBoardItem.css";
import { useZustandStore } from "../../store/useZustand";
import { getDefaultItemYPosition } from "../../functions/getDefaultItemYPosition";
import { useDraggableItemState } from "../../hooks/useDraggableItemState";
import { useDateHandling } from "../../hooks/useDateHandling";
import { useMouseHandlers } from "../../hooks/useMouseHandlers";
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
  // Ref to store the defaultY for this drag
  const dragDefaultY = React.useRef(null);
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

  // Get context, settings, and store methods from zustand store for board ID, date column, and timeline refresh
  const {
    settings,
    context,
    updateBoardItemDate,
    saveCustomItemYDelta,
    boardItems,
    timelineParams,
  } = useZustandStore();

  // Get position setting for bounds calculation
  const timelinePosition = settings?.position || "below";

  // Use custom hook for date handling
  const {
    isDatePickerOpen,
    selectedDate,
    openDatePicker,
    closeDatePicker,
    handleDateChange,
    setIsDatePickerOpen,
    setSelectedDate,
    getFormattedDate,
  } = useDateHandling(date);

  // Initialize size using utility function
  const [size, setSize] = useState(() =>
    calculateInitialSize(shape, showItemDates, true),
  );

  // Calculate initial position based on the item's date
  useEffect(() => {
    if (itemRef.current && containerRef.current) {
      // Center the item horizontally by default (50% of the container)
      const initialX = 50;
      setPosition((prev) => ({
        x: initialX,
        y: prev.y,
      }));
    }
  }, [size.width]);

  // Get item color using utility function
  const itemColor = getItemColor(item);

  // Format date using hook utility
  const formattedDate = getFormattedDate(date);

  const shapeStyles = getShapeStyles(shape);

  // Update size when shape or showItemDates changes
  useEffect(() => {
    const newSize = calculateInitialSize(shape, showItemDates);
    setSize(newSize);
  }, [shape, showItemDates]);

  // Use custom hook for mouse handlers
  // --- Custom drag end logic for Y delta persistence ---
  // Wrap the position change callback to persist Y delta on drag end
  // On drag end: calculate yDelta from dragDefaultY and save
  const handlePositionChangeWithYDelta = (itemId, newPosition) => {
    if (typeof dragDefaultY.current === "number" && typeof newPosition.y === "number") {
      const yDelta = newPosition.y - dragDefaultY.current;
      TimelineLogger.debug("[Y-DELTA] Drag end: saving yDelta", { itemId, yDelta, defaultY: dragDefaultY.current, finalY: newPosition.y });
      saveCustomItemYDelta(itemId, yDelta);
    }
    if (onPositionChange) {
      onPositionChange(itemId, newPosition);
    }
  };

  // On drag start: snapshot defaultY
  const handleMouseDownWithDefaultY = (e) => {
    if (
      boardItems &&
      timelineParams?.startDate &&
      timelineParams?.endDate &&
      settings?.position
    ) {
      const defaultY = getDefaultItemYPosition({
        items: boardItems,
        itemId: item.id,
        startDate: timelineParams.startDate,
        endDate: timelineParams.endDate,
        position: settings.position,
      });
      dragDefaultY.current = defaultY;
      TimelineLogger.debug("[Y-DELTA] Drag start: snapshotted defaultY", { itemId: item.id, defaultY });
    }
    handleMouseDown(e);
  };

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeMouseDown,
  } = useMouseHandlers({
    containerRef,
    dragStartPos,
    dragOffset,
    startSize,
    position,
    setPosition,
    size,
    setSize,
    setIsDragging,
    onPositionChange: handlePositionChangeWithYDelta,
    item,
    timelinePosition,
  });

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
      date,
    });
  };

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const containerStyles = getContainerStyles(position, size, isDragging);

  return (
    <div
      ref={(el) => {
        itemRef.current = el;
        // Also set the container ref when the element mounts/updates
        if (el) {
          containerRef.current = el.closest(".timeline-container");
        }
      }}
      style={containerStyles}
      onMouseDown={handleMouseDownWithDefaultY}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ItemContainer
        shape={shape}
        isDragging={isDragging}
        itemColor={itemColor}
        shapeStyles={shapeStyles}
        onClick={onClick}
        isHovered={isHovered}
        onHideItem={onHideItem}
        item={item}
        handleResizeMouseDown={handleResizeMouseDown}
        showItemDates={showItemDates}
        formattedDate={formattedDate}
        handleNameChange={handleNameChange}
        handleMouseDown={(e) => {
          TimelineLogger.debug(
            "[DRAG-DEBUG] handleMouseDown fired in ItemContainer",
            { itemId: item.id },
          );
          handleMouseDown(e);
        }}
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

export default DraggableBoardItem;
