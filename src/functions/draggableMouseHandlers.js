import TimelineLogger from "../utils/logger";
import {
  DRAGGABLE_ITEM,
  TIMELINE_LAYOUT,
  getTimelinePositionRatio,
} from "../utils/configConstants";

/**
 * Mouse handling functions for draggable board items
 * Extracted from DraggableBoardItem component for better organization
 */

/**
 * Creates mouse down handler for dragging
 * @param {Object} params - Handler parameters
 * @param {React.RefObject} params.dragStartPos - Ref to store drag start position
 * @param {React.RefObject} params.dragOffset - Ref to store drag offset
 * @param {Function} params.setIsDragging - State setter for dragging state
 * @param {Function} params.handleMouseMove - Mouse move handler function
 * @param {Function} params.handleMouseUp - Mouse up handler function
 * @returns {Function} Mouse down event handler
 */
export const createHandleMouseDown = ({
  dragStartPos,
  dragOffset,
  setIsDragging,
  handleMouseMove,
  handleMouseUp,
  position,
}) => {
  return (e) => {
    TimelineLogger.debug("[DRAG-DEBUG] createHandleMouseDown fired", {});
    // Only start drag on primary mouse button
    if (e.button !== 0) return;

    // Prevent text selection during drag
    e.preventDefault();

    // Save initial position
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    // Initialize drag offset to current item position to prevent jumping
    // This ensures each drag starts from where the item currently is
    dragOffset.current = {
      x: position?.x || 0,
      y: position?.y || 0,
    };

    // Set up event listeners for drag
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp, { once: true });

    setIsDragging(true);
  };
};

/**
 * Creates mouse move handler for dragging with position-aware bounds
 * @param {Object} params - Handler parameters
 * @param {React.RefObject} params.containerRef - Ref to container element
 * @param {React.RefObject} params.dragStartPos - Ref to drag start position
 * @param {React.RefObject} params.dragOffset - Ref to drag offset
 * @param {Object} params.position - Current position state
 * @param {Function} params.setPosition - Position state setter
 * @param {Function} params.onPositionChange - Position change callback
 * @param {Object} params.item - Board item data
 * @param {string} params.timelinePosition - Timeline position setting
 * @returns {Function} Mouse move event handler
 */
export const createHandleMouseMove = ({
  containerRef,
  dragStartPos,
  dragOffset,
  setPosition,
  onPositionChange,
  item,
  timelinePosition,
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

    // Calculate new position based on mouse movement
    const dy = e.clientY - dragStartPos.current.y;

    // Enhanced bounds calculation accounting for item size and timeline position
    const PADDING = DRAGGABLE_ITEM.CONTAINER_PADDING; // Minimum padding from container edges
    // Remove hardcoded bounds - let position-specific bounds handle this later

    const itemWidth = itemRect.width;

    // Calculate timeline position within container (matches TimelineLine logic)
    const getTimelinePosition = (pos) => {
      switch (pos) {
        case "above":
          return TIMELINE_LAYOUT.POSITION_ABOVE; // Timeline at 25% of container height
        case "below":
          return TIMELINE_LAYOUT.POSITION_BELOW; // Timeline at 75% of container height
        default:
          return getTimelinePositionRatio("center"); // Timeline at 50% of container height (center)
      }
    };

    // AGGRESSIVE DEBUG: Always log constants to verify import
    // console.log('🚨 CONSTANTS IMPORT CHECK:', {
    //   ALTERNATE_MAX_DISTANCE: DRAGGABLE_ITEM.ALTERNATE_MAX_DISTANCE,
    //   ALTERNATE_EDGE_BUFFER: DRAGGABLE_ITEM.ALTERNATE_EDGE_BUFFER,
    //   timelinePosition: timelinePosition
    // });

    // Only log timeline position for alternate mode
    if (timelinePosition === "alternate") {
      TimelineLogger.debug("🎯 ALTERNATE MODE DETECTED", {
        itemId: item.id,
        timelinePosition,
      });
    }

    const timelineRatio = getTimelinePosition(timelinePosition);
    const timelinePixelPosition = containerRect.height * timelineRatio;

    // Calculate position-aware Y bounds relative to timeline position
    const containerTop = DRAGGABLE_ITEM.CONTAINER_TOP_REFERENCE;
    const containerBottom = containerRect.height;

    // Y bounds are relative to timeline position, with position-specific constraints
    let minYFromTimeline, maxYFromTimeline;

    if (timelinePosition === "above") {
      // For 'above' position: timeline at 25%, use granular up/down limits
      minYFromTimeline = -DRAGGABLE_ITEM.ABOVE_MAX_DISTANCE_UP;
      // Limit downward movement with buffer from bottom edge
      const availableSpaceBelow =
        containerBottom -
        timelinePixelPosition -
        DRAGGABLE_ITEM.ABOVE_BOTTOM_BUFFER;
      maxYFromTimeline = Math.min(
        availableSpaceBelow,
        DRAGGABLE_ITEM.ABOVE_MAX_DISTANCE_DOWN,
      );

      // Debug logging for above position
      TimelineLogger.debug("🔍 ABOVE BOUNDS", {
        itemId: item.id,
        minY: minYFromTimeline,
        maxY: maxYFromTimeline,
        maxDistanceUp: DRAGGABLE_ITEM.ABOVE_MAX_DISTANCE_UP,
        maxDistanceDown: DRAGGABLE_ITEM.ABOVE_MAX_DISTANCE_DOWN,
        bottomBuffer: DRAGGABLE_ITEM.ABOVE_BOTTOM_BUFFER,
      });
    } else if (timelinePosition === "below") {
      // For 'below' position: timeline at 75%, use granular up/down limits
      const availableSpaceAbove =
        timelinePixelPosition - containerTop - DRAGGABLE_ITEM.BELOW_TOP_BUFFER;
      minYFromTimeline = Math.max(
        -availableSpaceAbove,
        -DRAGGABLE_ITEM.BELOW_MAX_DISTANCE_UP,
      );
      maxYFromTimeline = DRAGGABLE_ITEM.BELOW_MAX_DISTANCE_DOWN;

      // Debug logging for below position
      // TimelineLogger.debug('🔍 BELOW BOUNDS', {
      //   itemId: item.id,
      //   minY: minYFromTimeline,
      //   maxY: maxYFromTimeline,
      //   maxDistanceUp: DRAGGABLE_ITEM.BELOW_MAX_DISTANCE_UP,
      //   maxDistanceDown: DRAGGABLE_ITEM.BELOW_MAX_DISTANCE_DOWN,
      //   topBuffer: DRAGGABLE_ITEM.BELOW_TOP_BUFFER
      // });
    } else if (timelinePosition === "alternate") {
      // For 'alternate' position: use granular up/down limits for fine control

      // Calculate bounds relative to timeline position with container constraints
      const availableSpaceAbove =
        timelinePixelPosition -
        containerTop -
        DRAGGABLE_ITEM.ALTERNATE_EDGE_BUFFER;
      const availableSpaceBelow =
        containerBottom -
        timelinePixelPosition -
        DRAGGABLE_ITEM.ALTERNATE_EDGE_BUFFER;

      minYFromTimeline = Math.max(
        -availableSpaceAbove,
        -DRAGGABLE_ITEM.ALTERNATE_MAX_DISTANCE_UP,
      );
      maxYFromTimeline = Math.min(
        availableSpaceBelow,
        DRAGGABLE_ITEM.ALTERNATE_MAX_DISTANCE_DOWN,
      );

      // Log bounds calculation for alternate mode only
      TimelineLogger.debug("🔍 ALTERNATE BOUNDS", {
        itemId: item.id,
        minY: minYFromTimeline,
        maxY: maxYFromTimeline,
        maxDistanceUp: DRAGGABLE_ITEM.ALTERNATE_MAX_DISTANCE_UP,
        maxDistanceDown: DRAGGABLE_ITEM.ALTERNATE_MAX_DISTANCE_DOWN,
        edgeBuffer: DRAGGABLE_ITEM.ALTERNATE_EDGE_BUFFER,
      });
    } else {
      // For 'center' position: use full drag distance in both directions
      minYFromTimeline = Math.max(
        containerTop - timelinePixelPosition,
        -DRAGGABLE_ITEM.MAX_DRAG_DISTANCE,
      );
      maxYFromTimeline = Math.min(
        containerBottom - timelinePixelPosition,
        DRAGGABLE_ITEM.MAX_DRAG_DISTANCE,
      );
    }

    // Calculate proper bounds accounting for item size and timeline position
    const bounds = {
      minX: PADDING,
      maxX: containerRect.width - itemWidth - PADDING,
      minY: minYFromTimeline,
      maxY: maxYFromTimeline,
    };

    // Remove general bounds logging to reduce noise

    // Calculate new position based on mouse movement with proper bounds enforcement
    const containerLeft = containerRect.left;
    const mouseXInContainer = e.clientX - containerLeft;

    // Apply X bounds - ensure mouse position stays within container bounds
    const boundedMouseX = Math.max(
      bounds.minX + itemWidth / 2,
      Math.min(mouseXInContainer, bounds.maxX + itemWidth / 2),
    );

    // Convert bounded X position to percentage of timeline container width
    const newX = (boundedMouseX / containerRect.width) * 100;

    // Calculate new Y position with proper bounds enforcement
    const proposedY = dragOffset.current.y + dy;
    const boundedY = Math.max(bounds.minY, Math.min(proposedY, bounds.maxY));

    // Only log when bounds are actually enforced in alternate mode
    if (
      timelinePosition === "alternate" &&
      (boundedY !== proposedY ||
        Math.abs(boundedMouseX - mouseXInContainer) >
          DRAGGABLE_ITEM.MOUSE_POSITION_TOLERANCE)
    ) {
      TimelineLogger.debug("🚨 ALTERNATE BOUNDS ENFORCED", {
        itemId: item.id,
        proposedY,
        boundedY,
        yBoundsEnforced: boundedY !== proposedY,
      });
    }

    // Update position with bounded values
    setPosition({
      x: newX,
      y: boundedY,
    });

    // Notify parent of position change if callback is provided
    if (onPositionChange) {
      onPositionChange(item.id, {
        x: newX,
        y: boundedY
      }, false); // isDragEnd = false during drag
    }
  };
};

/**
 * Creates mouse up handler for dragging
 * @param {Object} params - Handler parameters
 * @param {Function} params.setIsDragging - State setter for dragging state
 * @param {Function} params.handleMouseMove - Mouse move handler function
 * @param {Function} params.handleMouseUp - Mouse up handler function
 * @param {Function} params.onPositionChange - Position change callback
 * @param {Object} params.item - Board item data
 * @param {Object} params.position - Current position state
 * @returns {Function} Mouse up event handler
 */
export const createHandleMouseUp = ({
  setIsDragging,
  handleMouseMove,
  handleMouseUp,
  onPositionChange,
  item,
  position,
}) => {
  return () => {
    TimelineLogger.debug("[DRAG-DEBUG] createHandleMouseUp fired", {});
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // Notify parent of position change
    onPositionChange?.(item.id, position);
  };
};

/**
 * Creates mouse down handler for resizing
 * @param {Object} params - Handler parameters
 * @param {React.RefObject} params.dragStartPos - Ref to store drag start position
 * @param {React.RefObject} params.startSize - Ref to store start size
 * @param {Object} params.size - Current size state
 * @param {Function} params.setIsResizing - State setter for resizing state
 * @param {Function} params.handleResizeMouseMove - Resize mouse move handler
 * @param {Function} params.handleResizeMouseUp - Resize mouse up handler
 * @returns {Function} Resize mouse down event handler
 */
export const createHandleResizeMouseDown = ({
  dragStartPos,
  startSize,
  size,
  setIsResizing,
  handleResizeMouseMove,
  handleResizeMouseUp,
}) => {
  return (e) => {
    // Only start resize on primary mouse button
    if (e.button !== 0) return;

    e.stopPropagation();

    // Save initial position and size
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { width: size.width, height: size.height };

    // Set up event listeners for resize
    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeMouseUp, { once: true });

    setIsResizing(true);
  };
};

/**
 * Creates mouse move handler for resizing
 * @param {Object} params - Handler parameters
 * @param {React.RefObject} params.dragStartPos - Ref to drag start position
 * @param {React.RefObject} params.startSize - Ref to start size
 * @param {Function} params.setSize - Size state setter
 * @returns {Function} Resize mouse move event handler
 */
export const createHandleResizeMouseMove = ({
  dragStartPos,
  startSize,
  setSize,
}) => {
  return (e) => {
    // Calculate new size based on mouse movement
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    // Minimum size constraints
    const minSize = DRAGGABLE_ITEM.MIN_SIZE;
    const newWidth = Math.max(minSize, startSize.current.width + dx);
    const newHeight = Math.max(minSize, startSize.current.height + dy);

    setSize({
      width: newWidth,
      height: newHeight,
    });
  };
};

/**
 * Creates mouse up handler for resizing
 * @param {Object} params - Handler parameters
 * @param {Function} params.setIsResizing - State setter for resizing state
 * @param {Function} params.handleResizeMouseMove - Resize mouse move handler
 * @param {Function} params.handleResizeMouseUp - Resize mouse up handler
 * @returns {Function} Resize mouse up event handler
 */
export const createHandleResizeMouseUp = ({
  setIsResizing,
  handleResizeMouseMove,
  handleResizeMouseUp,
}) => {
  return () => {
    // Clean up event listeners
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);

    setIsResizing(false);
  };
};
