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
 * Creat    // Apply the movement to the original drag offset position to maintain accuracy
    // This prevents jumps as we're always calculating from the original offset
    const proposedY = dragOffset.current.y + exactDy;

    // Get reference to the element we're dragging
    const draggableElement = containerRef?.current;
    
    // Store proposed values for debugging
    if (draggableElement) {
      draggableElement.dataset.proposedY = proposedY;
      draggableElement.dataset.startY = dragStartPos.current.y;
      draggableElement.dataset.offsetY = dragOffset.current.y;
      draggableElement.dataset.exactDy = exactDy;
    }

    // Only apply bounds if needed (but try to maintain exact mouse tracking)
    const boundedY = Math.max(bounds.minY, Math.min(proposedY, bounds.maxY));

    // Store bounded value for debugging
    if (draggableElement) {
      draggableElement.dataset.boundedY = boundedY;
    }ndler for dragging
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

    // Always prevent default browser behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();

    // Store the event type to differentiate between click and mousedown
    // Some browsers/frameworks may convert clicks to mousedown events
    const eventType = e.type;
    const isSimpleClick = eventType === "click";

    // Don't start dragging for simple clicks
    if (isSimpleClick) {
      TimelineLogger.debug("[DRAG-DEBUG] Ignoring simple click event", {});
      return;
    }

    // Prevent text selection during drag
    e.preventDefault();

    // Mark this event as handled by a draggable item
    e.nativeEvent._handledByDraggableItem = true;

    // Save initial position with high precision
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
    };

    // Get the current visual position of the element
    // This ensures we start from the actual current position, not the state position
    const currentElement = e.currentTarget;
    let currentVisualY = 0;

    if (currentElement) {
      // ENHANCED: Get the most accurate current visual position using multiple methods

      // Method 1: Extract inline style transform (most direct)
      const transform = currentElement.style.transform;
      const translateYMatch = transform.match(/translateY\(([^)]+)\)/);
      if (translateYMatch && translateYMatch[1]) {
        // Parse the current translateY value
        const translateY = translateYMatch[1];
        currentVisualY = parseFloat(translateY);
        TimelineLogger.debug(
          "[DRAG-DEBUG] Using inline transform for position",
          {
            transformValue: translateY,
            parsedY: currentVisualY,
          },
        );
      } else {
        // Method 2: Try computed style matrix (more reliable but more expensive)
        try {
          const computedStyle = window.getComputedStyle(currentElement);
          const matrix = new DOMMatrixReadOnly(computedStyle.transform);
          // The Y translation is in matrix.m42
          currentVisualY = matrix.m42;
          TimelineLogger.debug(
            "[DRAG-DEBUG] Using computed matrix for position",
            {
              matrixValue: matrix.toString(),
              translateY: currentVisualY,
            },
          );
        } catch (err) {
          // Method 3: Fall back to position data attributes if available
          if (currentElement.dataset.boundedY) {
            currentVisualY = parseFloat(currentElement.dataset.boundedY);
            TimelineLogger.debug(
              "[DRAG-DEBUG] Using dataset.boundedY for position",
              {
                datasetValue: currentElement.dataset.boundedY,
                parsedY: currentVisualY,
              },
            );
          }
        }
      }

      // Add a dragging class to the element being dragged
      currentElement.classList.add("dragging");
    }

    // FIXED: Initialize drag offset using the actual visual position as priority
    // This is critical to prevent jumping on subsequent drags
    dragOffset.current = {
      x: position?.x || 0,
      // ALWAYS prioritize the visual position we just extracted over any state position
      y: currentVisualY || position?.y || 0,
    };

    // Enhanced debugging: store more detailed information
    if (currentElement) {
      currentElement.dataset.originalX = position?.x || 0;
      currentElement.dataset.originalY = position?.y || 0;
      currentElement.dataset.startDragY = currentVisualY || position?.y || 0;
      // Add new data attributes for debugging second-drag issues
      currentElement.dataset.dragStartClientY = e.clientY;
      currentElement.dataset.dragOffsetY = dragOffset.current.y;
      currentElement.dataset.usedVisualY = Boolean(currentVisualY).toString();
    }

    TimelineLogger.debug("[DRAG-DEBUG] Drag starting with offset", {
      offsetX: dragOffset.current.x,
      offsetY: dragOffset.current.y,
      clientX: e.clientX,
      clientY: e.clientY,
    });

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

    // Get reference to the element we're dragging - do this early to use throughout
    const draggableElement = containerRef?.current;

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

    // Calculate Y movement with high precision
    // Use the exact mouse movement delta relative to start position
    const exactDy = e.clientY - dragStartPos.current.y;

    // Apply the movement to the original drag offset position to maintain accuracy
    // This prevents jumps as we're always calculating from the original offset
    const proposedY = dragOffset.current.y + exactDy;

    // Preserve the proposed Y value in a data attribute for debugging
    const element = containerRef?.current;
    if (element) {
      element.dataset.proposedY = proposedY;
    }

    // Only apply bounds if needed (but try to maintain exact mouse tracking)
    const boundedY = Math.max(bounds.minY, Math.min(proposedY, bounds.maxY));

    // Preserve the bounded Y value too
    if (element) {
      element.dataset.boundedY = boundedY;
    }

    // Log when mouse tracking isn't exact due to bounds enforcement
    if (boundedY !== proposedY) {
      TimelineLogger.debug("🚨 Y BOUNDS ENFORCED", {
        itemId: item?.id,
        mouseY: e.clientY,
        startY: dragStartPos.current.y,
        exactDy,
        offsetY: dragOffset.current.y,
        proposedY,
        boundedY,
      });
    }

    // Update position with bounded values
    setPosition({
      x: newX,
      y: boundedY,
    });

    // CRITICAL: Update connector positions along with item position
    // This ensures connectors move with items during drag
    const connectorId = `board-item-${item?.id}`;
    const connectorAnchor = document.getElementById(connectorId);
    if (connectorAnchor) {
      // Apply the EXACT same transform to the connector anchor as the item
      // This is critical for maintaining alignment during drag
      connectorAnchor.style.transform = `translateY(${boundedY}px)`;

      // Force a minimal repaint to ensure the connector position is updated
      // without causing unnecessary layout thrashing
      void connectorAnchor.offsetHeight;
    }

    // Also apply the transform directly to the dragging element if available
    // This ensures the element follows the mouse precisely
    if (draggableElement) {
      draggableElement.style.transform = `translateY(${boundedY}px)`;
      void draggableElement.offsetHeight;
    }

    // Notify other components about the position change
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
  return (e) => {
    TimelineLogger.debug("[DRAG-DEBUG] createHandleMouseUp fired", {});

    // Stop propagation and prevent default to keep events contained
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Reset dragging state immediately
    setIsDragging(false);

    // Clean up all event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // Find the element that was being dragged
    const draggableElement = document.querySelector(".dragging");

    // Remove the dragging class from any elements that have it
    document.querySelectorAll(".dragging").forEach((el) => {
      el.classList.remove("dragging");
    });

    // If we have a draggable element, make sure its final position is set correctly
    if (draggableElement) {
      // ENHANCED: Get the most accurate current visual position
      let finalY = 0;
      let positionFound = false;

      // Method 1: Extract inline style transform (most direct)
      const transform = draggableElement.style.transform;
      const translateYMatch = transform.match(/translateY\(([^)]+)\)/);
      if (translateYMatch && translateYMatch[1]) {
        // Parse the current translateY value
        const translateY = translateYMatch[1];
        finalY = parseFloat(translateY);
        positionFound = true;

        TimelineLogger.debug(
          "[DRAG-END] Using inline transform for final position",
          {
            itemId: item?.id,
            transformValue: translateY,
            parsedY: finalY,
          },
        );
      }

      // Method 2: If inline transform not found, try computed style
      if (!positionFound) {
        try {
          const computedStyle = window.getComputedStyle(draggableElement);
          const matrix = new DOMMatrixReadOnly(computedStyle.transform);
          finalY = matrix.m42;
          positionFound = true;

          TimelineLogger.debug(
            "[DRAG-END] Using computed matrix for final position",
            {
              itemId: item?.id,
              matrixValue: matrix.toString(),
              translateY: finalY,
            },
          );
        } catch (err) {
          // Method 3: Fall back to position data attributes if available
          if (draggableElement.dataset.boundedY) {
            finalY = parseFloat(draggableElement.dataset.boundedY);
            positionFound = true;

            TimelineLogger.debug(
              "[DRAG-END] Using dataset.boundedY for final position",
              {
                itemId: item?.id,
                datasetValue: draggableElement.dataset.boundedY,
                parsedY: finalY,
              },
            );
          }
        }
      }

      // Store the final position in a data attribute for future drag reference
      draggableElement.dataset.lastFinalY = finalY;

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
    }

    // Make sure connector positions are updated too
    if (item?.id) {
      // Get the connector anchor element
      const connectorId = `board-item-${item.id}`;
      const connectorAnchor = document.getElementById(connectorId);

      // If we have a connector anchor, update its position
      if (connectorAnchor && position) {
        // Apply the final Y position to the connector anchor
        const finalY = position.y;
        connectorAnchor.style.transform = `translateY(${finalY}px)`;

        // Force a minimal repaint to ensure the connector position is updated
        void connectorAnchor.offsetHeight;
      }

      // Trigger a specific event for connector line updates
      const updateEvent = new CustomEvent("timeline-connector-update", {
        bubbles: true,
        detail: { itemId: item.id, isDragEnd: true },
      });
      document.dispatchEvent(updateEvent);
    }

    // Only call onPositionChange if both are provided to avoid issues
    if (onPositionChange && item?.id && position) {
      TimelineLogger.debug(
        "[Y-DELTA][DRAG-END] createHandleMouseUp: passing isDragEnd=true",
        { itemId: item.id, position },
      );
      onPositionChange(item.id, position, true);
    } else {
      // Use the closure-scoped handleMouseUp function that was provided
      // This function should handle the position change in a way that avoids circular deps
      handleMouseUp?.();
    }
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
