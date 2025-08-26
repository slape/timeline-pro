// positionUtils.js
import TimelineLogger from "../../utils/logger";
import {
  extractTranslateY,
  getTransformMatrix,
  applyTranslateY,
} from "./transformUtils";

/**
 * Extract the visual Y position of an element using multiple methods
 * @param {HTMLElement} element - The element to extract position from
 * @returns {number} The visual Y position in pixels, or 0 if not found
 */
export const extractVisualYPosition = (element) => {
  if (!element) return 0;

  let visualY = 0;
  let positionFound = false;

  // Method 1: Extract inline style transform
  const translateY = extractTranslateY(element);
  if (translateY !== null) {
    visualY = translateY;
    positionFound = true;
    TimelineLogger.debug("[POSITION] Using inline transform for position", {
      transformValue: translateY,
      parsedY: visualY,
    });
  }

  // Method 2: Try computed style matrix
  if (!positionFound) {
    const matrix = getTransformMatrix(element);
    if (matrix) {
      visualY = matrix.m42;
      positionFound = true;
      TimelineLogger.debug("[POSITION] Using computed matrix for position", {
        matrixValue: matrix.toString(),
        translateY: visualY,
      });
    } else {
      // Method 3: Fall back to position data attributes
      if (element.dataset.boundedY) {
        visualY = parseFloat(element.dataset.boundedY);
        positionFound = true;
        TimelineLogger.debug("[POSITION] Using dataset.boundedY for position", {
          datasetValue: element.dataset.boundedY,
          parsedY: visualY,
        });
      }
    }
  }

  return visualY;
};

/**
 * Store debugging information in element's dataset
 * @param {HTMLElement} element - The element to store data on
 * @param {Object} data - Data to store
 */
export const storePositionDebugInfo = (element, data) => {
  if (!element) return;

  const {
    originalX,
    originalY,
    startDragY,
    dragStartClientY,
    dragOffsetY,
    currentVisualY,
    usedVisualY,
    proposedY,
    boundedY,
  } = data;

  if (originalX !== undefined) element.dataset.originalX = originalX;
  if (originalY !== undefined) element.dataset.originalY = originalY;
  if (startDragY !== undefined) element.dataset.startDragY = startDragY;

  if (dragStartClientY !== undefined)
    element.dataset.dragStartClientY = dragStartClientY;
  if (dragOffsetY !== undefined) element.dataset.dragOffsetY = dragOffsetY;

  if (currentVisualY !== undefined)
    element.dataset.currentVisualY = currentVisualY;
  if (usedVisualY !== undefined)
    element.dataset.usedVisualY = usedVisualY.toString();
  if (proposedY !== undefined) element.dataset.proposedY = proposedY;
  if (boundedY !== undefined) element.dataset.boundedY = boundedY;
};

/**
 * Update the visual position of an element using transform
 * @param {HTMLElement} element - The element to update
 * @param {number} yPosition - The y position in pixels
 */
export const updateElementYPosition = (element, yPosition) => {
  if (!element) return;

  applyTranslateY(element, yPosition);
};

/**
 * Update connector position to match a draggable item
 * @param {string} itemId - ID of the item to update connector for
 * @param {number} yPosition - Y position to apply
 * @param {boolean} isDragEnd - Whether this is a drag end event
 * @returns {HTMLElement|null} - The connector element or null if not found
 */
export const updateConnectorPosition = (
  itemId,
  yPosition,
  isDragEnd = false,
) => {
  if (!itemId) return null;

  const connectorId = `board-item-${itemId}`;
  const connectorAnchor = document.getElementById(connectorId);

  // Also find the actual draggable item element to get its dimensions
  const draggableItem =
    document.querySelector(`[data-item-id="${itemId}"]`) ||
    document.querySelector(`.draggable-board-item[data-id="${itemId}"]`);

  if (connectorAnchor && draggableItem) {
    // Get the timeline container to calculate relative positions
    const timelineContainer = connectorAnchor.closest(".timeline-container");
    if (!timelineContainer) return null;

    // Get the bounding rectangles
    const containerRect = timelineContainer.getBoundingClientRect();
    const itemRect = draggableItem.getBoundingClientRect();

    // Calculate the item's center Y position relative to the container
    const itemTopY = itemRect.top - containerRect.top;
    const itemHeight = itemRect.height;
    const itemCenterY = itemTopY + itemHeight / 2;

    // Calculate the centerpoint offset from the top of the item
    const centerOffset = itemHeight / 2;

    // Apply the transform to position the connector anchor
    // Use the current yPosition which is the top of the item
    // The connector will be drawn from the center of the item
    // which is calculated in the LeaderLineConnector component
    applyTranslateY(connectorAnchor, yPosition);

    // Store position data in the anchor for reference
    connectorAnchor.dataset.finalPosition = yPosition;
    connectorAnchor.dataset.positionY = yPosition;
    connectorAnchor.dataset.itemHeight = itemHeight;
    connectorAnchor.dataset.centerOffset = centerOffset;
    connectorAnchor.dataset.itemCenterY = itemCenterY;

    // Ensure the connector stays active by setting an attribute
    connectorAnchor.dataset.active = "true";
    connectorAnchor.dataset.isDragging = "true";

    // Notify all relevant components about the position update
    const updateEvent = new CustomEvent("timeline-connector-update", {
      bubbles: true,
      detail: {
        itemId,
        y: yPosition,
        connectorId,
        itemHeight,
        itemCenterY,
        centerOffset,
        isDragging: true,
        isDragEnd,
      },
    });
    document.dispatchEvent(updateEvent);

    // Debug the connector position update
    TimelineLogger.debug("[CONNECTOR] Updating connector position", {
      itemId,
      yPosition,
      connectorId,
      itemCenterY,
      centerOffset,
      connectorFound: Boolean(connectorAnchor),
      draggableItemFound: Boolean(draggableItem),
      itemHeight,
      isDragEnd,
    });

    return connectorAnchor;
  }

  return null;
};
