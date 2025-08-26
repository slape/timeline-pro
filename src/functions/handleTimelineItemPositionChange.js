import TimelineLogger from "../utils/logger";
import { LANE_HEIGHT } from "../utils/configConstants";

/**
 * Handles timeline item position changes during drag operations
 * Calculates new date based on X position percentage and calls the parent's onItemMove callback
 * Also converts Y-position to Row/Lane shift format for storage
 *
 * @param {string} itemId - ID of the item being moved
 * @param {Object} newPosition - New position object with x and y coordinates
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {Function} onItemMove - Callback function to handle item move
 * @param {boolean} isDragEnd - Whether this is the end of a drag operation
 */
const handleTimelineItemPositionChange = (
  itemId,
  newPosition,
  startDate,
  endDate,
  onItemMove,
  isDragEnd = false,
) => {
  TimelineLogger.userAction("timelineItemDragged", {
    itemId,
    newPosition,
    isDragEnd,
  });

  // Calculate the new date based on the X position percentage
  const timeRange = endDate - startDate;
  const newDate = new Date(
    startDate.getTime() + (newPosition.x / 100) * timeRange,
  );

  // Convert Y position to row/lane shift format
  // The rowShift is the Y position divided by the lane height, rounded to nearest integer
  // The laneOffset is 0 by default (can be customized in future enhancements)
  const rowShift = Math.round(newPosition.y / LANE_HEIGHT);
  const laneOffset = 0;

  // Create the updated position object with the new date and row/lane shift
  const updatedPosition = {
    ...newPosition,
    date: newDate,
    rowShift,
    laneOffset,
  };

  // Log conversion for debugging
  if (isDragEnd) {
    TimelineLogger.debug("[POSITION] Converting Y to Row/Lane format", {
      itemId,
      y: newPosition.y,
      rowShift,
      laneOffset,
      isDragEnd,
    });
  }

  // Call the parent component's onItemMove function with correct parameters
  if (onItemMove) {
    onItemMove(itemId, updatedPosition, isDragEnd);
  }

  // If this is the end of a drag, dispatch an event to update connectors
  if (isDragEnd) {
    const updateEvent = new CustomEvent("timeline-item-position-final", {
      bubbles: true,
      detail: {
        itemId,
        position: newPosition,
        rowShift,
        laneOffset,
      },
    });
    document.dispatchEvent(updateEvent);
  }
};

export default handleTimelineItemPositionChange;
