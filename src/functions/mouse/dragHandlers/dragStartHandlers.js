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
}) => {
  // Store drag start position
  dragStartPos.current = {
    x: e.clientX,
    y: e.clientY,
  };

  // Get current element and extract visual position
  const currentElement = e.currentTarget;
  const currentVisualY = extractVisualYPosition(currentElement);

  // Add dragging class
  if (currentElement) {
    currentElement.classList.add("dragging");
  }

  // Initialize drag offset using visual position as priority
  dragOffset.current = {
    x: position?.x || 0,
    y: currentVisualY || position?.y || 0,
  };

  // Store debug info
  if (currentElement) {
    storePositionDebugInfo(currentElement, {
      originalX: position?.x || 0,
      originalY: position?.y || 0,
      startDragY: currentVisualY || position?.y || 0,
      dragStartClientY: e.clientY,
      dragOffsetY: dragOffset.current.y,
      usedVisualY: Boolean(currentVisualY),
    });
  }

  // Log
  TimelineLogger.debug("[DRAG-DEBUG] Drag starting with offset", {
    offsetX: dragOffset.current.x,
    offsetY: dragOffset.current.y,
    clientX: e.clientX,
    clientY: e.clientY,
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
