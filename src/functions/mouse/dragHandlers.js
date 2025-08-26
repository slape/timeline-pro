import TimelineLogger from "../../utils/logger";
import { calculateDragBounds } from "./boundsCalculator";

// Import handlers from modular structure
import {
  validateDragStart,
  initializeDragPosition,
  setupDragEventListeners,
} from "./dragHandlers/dragStartHandlers";
import {
  calculateNewPosition,
  updateElementsForDrag,
  notifyPositionChange,
} from "./dragHandlers/dragMoveHandlers";
import {
  finalizeDragOperation,
  extractFinalPosition,
  synchronizePositionState,
  updateConnectorsOnDragEnd,
} from "./dragHandlers/dragEndHandlers";

/**
 * Creates mouse down handler for dragging
 */
export const createHandleMouseDown = ({
  dragStartPos,
  dragOffset,
  setIsDragging,
  handleMouseMove,
  handleMouseUp,
  position,
  currentVisualPosition,
}) => {
  return (e) => {
    TimelineLogger.debug("[DRAG-DEBUG] createHandleMouseDown fired", {});

    // Validate if we should start the drag
    if (!validateDragStart(e)) {
      return;
    }

    // Initialize position data and get drag element info
    const { currentVisualY } = initializeDragPosition({
      e,
      dragStartPos,
      dragOffset,
      position,
      currentVisualPosition,
    });

    // Set up event listeners
    setupDragEventListeners({
      handleMouseMove,
      handleMouseUp,
      setIsDragging,
    });

    // Store current visual position if ref available
    if (currentVisualPosition) {
      currentVisualPosition.current = currentVisualY;
    }
  };
};

/**
 * Creates mouse move handler for dragging
 */
export const createHandleMouseMove = ({
  containerRef,
  dragStartPos,
  dragOffset,
  setPosition,
  onPositionChange,
  item,
  timelinePosition,
  currentVisualPosition,
}) => {
  return (e) => {
    TimelineLogger.debug("[DRAG-DEBUG] createHandleMouseMove fired", {});
    if (!containerRef.current) return;

    // Get timeline container dimensions dynamically
    const timelineContainer = document.querySelector(".timeline-container");
    if (!timelineContainer) {
      TimelineLogger.warn(
        "Timeline container not found for bounds calculation",
      );
      return;
    }

    const containerRect = timelineContainer.getBoundingClientRect();
    const itemRect = containerRef.current.getBoundingClientRect();

    // Calculate bounds based on timeline position and container dimensions
    const bounds = calculateDragBounds({
      containerRect,
      itemRect,
      timelinePosition,
      item,
    });

    // Calculate new position based on mouse movement with proper bounds enforcement
    const { newX, proposedY, boundedY, exactDy } = calculateNewPosition({
      e,
      containerRect,
      itemRect,
      bounds,
      dragStartPos,
      dragOffset,
    });

    // Get reference to the element we're dragging
    const element = containerRef?.current;

    // Update position with bounded values
    setPosition({
      x: newX,
      y: boundedY,
    });

    // Update visual elements and store debugging info
    updateElementsForDrag({
      element,
      item,
      boundedY,
      proposedY,
      exactDy,
      dragStartPos,
      dragOffset,
      currentVisualPosition,
      e,
    });

    // Notify other components about the position change
    notifyPositionChange({
      item,
      newX,
      boundedY,
      onPositionChange,
    });
  };
};

/**
 * Creates mouse up handler for dragging
 */
export const createHandleMouseUp = ({
  setIsDragging,
  handleMouseMove,
  handleMouseUp,
  onPositionChange,
  item,
  position,
  currentVisualPosition,
}) => {
  return (e) => {
    TimelineLogger.debug("[DRAG-DEBUG] createHandleMouseUp fired", {});

    // Clean up resources and reset state
    finalizeDragOperation({
      e,
      setIsDragging,
      handleMouseMove,
      handleMouseUp,
    });

    // Extract the final position of the dragged element
    const { finalY, positionFound } = extractFinalPosition({
      item,
      position,
      currentVisualPosition,
    });

    // Synchronize the state with visual position
    synchronizePositionState({
      item,
      finalY,
      positionFound,
      position,
      onPositionChange,
    });

    // Update connector positions
    updateConnectorsOnDragEnd({
      item,
      currentVisualPosition,
      position,
    });

    // Final callback if needed
    if (onPositionChange && item?.id && position) {
      TimelineLogger.debug(
        "[Y-DELTA][DRAG-END] createHandleMouseUp: passing isDragEnd=true",
        { itemId: item.id, position },
      );
      onPositionChange(item.id, position, true);
    } else {
      // Use the closure-scoped handleMouseUp function that was provided
      handleMouseUp?.();
    }
  };
};
