import React from "react";
import { Box } from "@vibe/core";
import ItemRemoveButton from "./ItemRemoveButton";
import ItemResizeHandle from "./ItemResizeHandle";
import ItemContent from "./ItemContent";
import { getBoxStyles } from "../../functions/draggableItemStyles";

/**
 * Container component for timeline items
 * Wraps the Box component and contains all item sub-components
 */
const ItemContainer = ({
  shape,
  isDragging,
  itemColor,
  shapeStyles,
  onClick,
  isHovered,
  onHideItem,
  item,
  handleResizeMouseDown,
  showItemDates,
  formattedDate,
  handleNameChange,
  handleMouseDown,
  handleOpenDatePicker,
}) => {
  const boxStyles = getBoxStyles(isDragging, itemColor, shapeStyles);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
      onMouseDown={(e) => {
        // Stop propagation and prevent default to keep events contained
        e.stopPropagation();
        e.preventDefault();
        if (handleMouseDown) handleMouseDown(e);
      }}
    >
      <Box
        className={shape === "circle" ? "circle-shape" : ""}
        style={boxStyles}
        onClick={(e) => {
          // Prevent click event from triggering dragging behavior
          e.stopPropagation();
          if (onClick) onClick(e);
        }}
      >
        <ItemRemoveButton
          isVisible={isHovered && onHideItem}
          onRemove={onHideItem}
          itemId={item.id}
        />

        <ItemResizeHandle onMouseDown={handleResizeMouseDown} />

        <ItemContent
          item={item}
          showItemDates={showItemDates}
          formattedDate={formattedDate}
          handleNameChange={handleNameChange}
          handleMouseDown={handleMouseDown}
          handleOpenDatePicker={handleOpenDatePicker}
        />
      </Box>
    </div>
  );
};

export default ItemContainer;
