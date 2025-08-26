import TimelineLogger from "../../../utils/logger";
import {
  extractVisualYPosition,
  storePositionDebugInfo,
} from "../positionUtils";

/**
 * Handle the initial validation for a drag operation
 * @param {Object} e - Mouse event
 * @returns {boolean} Whether to continue with drag initialization
 */
export const validateDragStart = (e) => {
  // Only allow primary mouse button
  if (e.button !== 0) return false;

  // Handle event propagation
  e.preventDefault();
  e.stopPropagation();

  // Check if it's a simple click vs. mousedown
  const isSimpleClick = e.type === "click";
  if (isSimpleClick) {
    TimelineLogger.debug("[DRAG-DEBUG] Ignoring simple click event", {});
    return false;
  }

  // Mark as handled by draggable item
  e.nativeEvent._handledByDraggableItem = true;

  return true;
};

/**
 * Initialize drag position and store references
 * @param {Object} options - Options
 * @param {Object} e - Mouse event
 */
export const initializeDragPosition = ({
  e,
  dragStartPos,
  dragOffset,
  position,
  currentVisualPosition,
}) => {
  // Store drag start position
  dragStartPos.current = {
    x: e.clientX,
    y: e.clientY,
  };

  // Get current element and extract visual position
  const currentElement = e.currentTarget;
  
  // IMPORTANT: Get the current visual position directly from the element
  // This is crucial for handling subsequent drags correctly
  const currentVisualY = extractVisualYPosition(currentElement);
  
  // Log the current visual position and state position for debugging
  TimelineLogger.debug("[DRAG-START] Position comparison", {
    visualY: currentVisualY,
    stateY: position?.y,
    difference: position?.y !== undefined ? currentVisualY - position.y : "N/A",
  });

  // Add dragging class
  if (currentElement) {
    currentElement.classList.add("dragging");
  }

  // CRITICAL: Use visual position as the source of truth to prevent jumps
  // This ensures that the drag offset starts from where the element visually appears
  dragOffset.current = {
    x: position?.x || 0,
    y: currentVisualY !== 0 ? currentVisualY : position?.y || 0,
  };
  
  // Update the current visual position ref if provided
  if (currentVisualPosition) {
    currentVisualPosition.current = currentVisualY;
  }

  // Store debug info
  if (currentElement) {
    storePositionDebugInfo(currentElement, {
      originalX: position?.x || 0,
      originalY: position?.y || 0,
      startDragY: currentVisualY || position?.y || 0,
      dragStartClientY: e.clientY,
      dragOffsetY: dragOffset.current.y,
      usedVisualY: Boolean(currentVisualY),
      currentVisualY: currentVisualY,
    });
  }

  // Log
  TimelineLogger.debug("[DRAG-DEBUG] Drag starting with offset", {
    offsetX: dragOffset.current.x,
    offsetY: dragOffset.current.y,
    clientX: e.clientX,
    clientY: e.clientY,
    visualY: currentVisualY,
    stateY: position?.y,
  });

  return { currentElement, currentVisualY };
};

/**
 * Set up event listeners for drag
 * @param {Object} options - Options
 */
export const setupDragEventListeners = ({
  handleMouseMove,
  handleMouseUp,
  setIsDragging,
}) => {
  // Set up event listeners
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp, { once: true });

  // Set dragging state
  setIsDragging(true);
};
