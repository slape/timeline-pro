import TimelineLogger from "../../../utils/logger";
import {
  storePositionDebugInfo,
  updateElementYPosition,
  updateConnectorPosition,
} from "../positionUtils";

/**
 * Calculate new position based on mouse movement
 * @param {Object} options - Options
 * @returns {Object} Calculated position values
 */
export const calculateNewPosition = ({
  e,
  containerRect,
  itemRect,
  bounds,
  dragStartPos,
  dragOffset,
}) => {
  // Calculate X position
  const containerLeft = containerRect.left;
  const mouseXInContainer = e.clientX - containerLeft;

  // Apply X bounds - ensure mouse position stays within container bounds
  const boundedMouseX = Math.max(
    bounds.minX + itemRect.width / 2,
    Math.min(mouseXInContainer, bounds.maxX + itemRect.width / 2),
  );

  // Convert bounded X position to percentage of timeline container width
  const newX = (boundedMouseX / containerRect.width) * 100;

  // Calculate Y movement with high precision
  const exactDy = e.clientY - dragStartPos.current.y;

  // Apply the movement to the original drag offset position to maintain accuracy
  const proposedY = dragOffset.current.y + exactDy;

  // Only apply bounds if needed (but try to maintain exact mouse tracking)
  const boundedY = Math.max(bounds.minY, Math.min(proposedY, bounds.maxY));

  return {
    newX,
    proposedY,
    boundedY,
    exactDy,
  };
};

/**
 * Update elements visually during drag
 * @param {Object} options - Options
 */
export const updateElementsForDrag = ({
  element,
  item,
  boundedY,
  proposedY,
  exactDy,
  dragStartPos,
  dragOffset,
  currentVisualPosition,
  e,
}) => {
  // Store debugging data
  if (element) {
    storePositionDebugInfo(element, {
      proposedY,
      startY: dragStartPos.current.y,
      currentY: e?.clientY || 0,
      offsetY: dragOffset.current.y,
      exactDy,
      boundedY,
    });
    
    // Log position tracking for debugging
    TimelineLogger.debug("[DRAG-MOVE] Position tracking", {
      itemId: item?.id,
      mouseY: e?.clientY || 0,
      exactDy,
      dragStartY: dragStartPos.current.y,
      dragOffsetY: dragOffset.current.y,
      proposedY,
      boundedY,
      visualPositionRef: currentVisualPosition?.current,
    });
  }

  // Log when mouse tracking isn't exact due to bounds enforcement
  if (boundedY !== proposedY) {
    TimelineLogger.debug("🚨 Y BOUNDS ENFORCED", {
      itemId: item?.id,
      mouseY: e?.clientY || 0,
      startY: dragStartPos.current.y,
      exactDy,
      offsetY: dragOffset.current.y,
      proposedY,
      boundedY,
    });
  }

  // Apply the transform directly to the dragging element first
  if (element) {
    // Update the element's visual position
    updateElementYPosition(element, boundedY);

    // CRITICAL: Always update the visual position ref to keep track of
    // where the element actually is visually during the drag
    if (currentVisualPosition) {
      currentVisualPosition.current = boundedY;
    }

    // Also add position data attributes for the connector calculations
    // and future reference to ensure consistent behavior
    element.dataset.dragY = boundedY;
    element.dataset.lastPositionY = boundedY;
    element.dataset.currentVisualY = boundedY;
  }

  // Update connector position AFTER updating the element
  // This ensures the connector stays in sync with the item's visual position
  updateConnectorPosition(item?.id, boundedY);

  // Trigger a position change event to update any connected components
  const updateEvent = new CustomEvent("timeline-position-changed", {
    bubbles: true,
    detail: {
      itemId: item?.id,
      y: boundedY,
      isDragging: true,
    },
  });
  document.dispatchEvent(updateEvent);
};

/**
 * Notify other components about position change
 * @param {Object} options - Options
 */
export const notifyPositionChange = ({
  item,
  newX,
  boundedY,
  onPositionChange,
}) => {
  // Dispatch event for other components
  const updateEvent = new CustomEvent("timeline-position-changed", {
    bubbles: true,
    detail: { itemId: item?.id },
  });
  document.dispatchEvent(updateEvent);

  // Notify parent of position change if callback is provided
  if (onPositionChange && item?.id) {
    onPositionChange(
      item.id,
      {
        x: newX,
        y: boundedY,
      },
      false, // isDragEnd = false during drag
    );
  }
};
