import TimelineLogger from "../../../utils/logger";
import {
  extractVisualYPosition,
  storePositionDebugInfo,
} from "../positionUtils";
import { cleanupDocumentListeners } from "../eventUtils";

/**
 * Clean up after drag operation ends
 * @param {Object} options - Options
 */
export const finalizeDragOperation = ({
  e,
  setIsDragging,
  handleMouseMove,
  handleMouseUp,
}) => {
  // Stop propagation and prevent default to keep events contained
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  // Reset dragging state immediately
  setIsDragging(false);

  // Clean up all event listeners
  cleanupDocumentListeners({
    moveHandler: handleMouseMove,
    upHandler: handleMouseUp,
  });

  // Remove the dragging class from any elements that have it
  document.querySelectorAll(".dragging").forEach((el) => {
    el.classList.remove("dragging");
  });
};

/**
 * Extract the final position after drag
 * @param {Object} options - Options
 * @returns {Object} Final position information
 */
export const extractFinalPosition = ({
  item,
  position,
  currentVisualPosition,
}) => {
  // Find the element that was being dragged
  const draggableElement = document.querySelector(".dragging");
  if (!draggableElement) return { positionFound: false };

  // Get the most accurate current visual position
  let finalY = extractVisualYPosition(draggableElement);
  let positionFound = finalY !== 0;

  // Store the final position in a data attribute for future drag reference
  if (positionFound) {
    storePositionDebugInfo(draggableElement, { lastFinalY: finalY });

    // Use current visual position from ref if available (most reliable)
    if (currentVisualPosition && currentVisualPosition.current !== undefined) {
      finalY = currentVisualPosition.current;

      TimelineLogger.debug(
        "[DRAG-END] Using currentVisualPosition ref for final position",
        {
          itemId: item?.id,
          refValue: finalY,
          previousStateY: position?.y,
        },
      );
    }
  }

  return { finalY, positionFound, draggableElement };
};

/**
 * Synchronize state with visual position
 * @param {Object} options - Options
 */
export const synchronizePositionState = ({
  item,
  finalY,
  positionFound,
  position,
  onPositionChange,
}) => {
  // CRITICAL: ALWAYS update position if we found a final position
  // This prevents jumps on subsequent drags by keeping state in sync with visual
  if (positionFound && item?.id && onPositionChange) {
    TimelineLogger.debug(
      "[DRAG-END] Updating position state with final visual position",
      {
        itemId: item.id,
        finalY,
        previousStateY: position?.y,
      },
    );

    // Use the ACTUAL final visual position for the state update
    onPositionChange(
      item.id,
      { ...(position || { x: 0 }), y: finalY },
      true, // isDragEnd = true to save the position
    );
  }
};

/**
 * Update connectors after drag ends
 * @param {Object} options - Options
 */
export const updateConnectorsOnDragEnd = ({
  item,
  currentVisualPosition,
  position,
}) => {
  if (!item?.id) return;

  // Import the updateConnectorPosition function
  // We're importing it here to avoid circular dependencies
  const { updateConnectorPosition } = require("../positionUtils");

  // Update connector with the same final position - prioritize visual position
  // Critically important: Always use visual position if available
  const finalY = currentVisualPosition?.current || position?.y || 0;

  // Log the final position we're using for the connector
  TimelineLogger.debug("[DRAG-END] Updating connector with final position", {
    itemId: item.id,
    finalY,
    fromVisualRef: Boolean(currentVisualPosition?.current),
    visualPosition: currentVisualPosition?.current,
    statePosition: position?.y,
  });

  // Find the connector anchor element
  const connectorAnchor = document.getElementById(`board-item-${item.id}`);
  if (connectorAnchor) {
    // Reset the dragging flag
    connectorAnchor.dataset.isDragging = "false";
  }

  // Use our unified connector position update function
  // This will handle both the DOM updates and event dispatch
  updateConnectorPosition(item.id, finalY, true); // isDragEnd = true

  // Use a robust approach with multiple updates at different delays
  // This ensures we catch any DOM repaints or state resets
  const updateWithDelay = (delay) => {
    setTimeout(() => {
      updateConnectorPosition(item.id, finalY, true);
    }, delay);
  };

  // Schedule multiple updates to ensure connector is properly positioned
  updateWithDelay(16); // One frame
  updateWithDelay(32); // Two frames
  updateWithDelay(100); // Longer delay
  updateWithDelay(250); // Even longer delay for safety

  // Also trigger a dedicated final position event for any components
  // listening for the end of drag operations
  const finalizeEvent = new CustomEvent("timeline-item-position-final", {
    bubbles: true,
    detail: {
      itemId: item.id,
      y: finalY,
      isDragEnd: true,
    },
  });
  document.dispatchEvent(finalizeEvent);
};
