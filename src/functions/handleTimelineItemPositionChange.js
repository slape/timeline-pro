import TimelineLogger from "../utils/logger";

/**
 * Handles timeline item position changes during drag operations
 * Calculates new date based on X position percentage and calls the parent's onItemMove callback
 *
 * @param {string} itemId - ID of the item being moved
 * @param {Object} newPosition - New position object with x coordinate
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {Function} onItemMove - Callback function to handle item move
 */
const handleTimelineItemPositionChange = (
  itemId,
  newPosition,
  startDate,
  endDate,
  onItemMove,
) => {
  TimelineLogger.userAction("timelineItemDragged", { itemId, newPosition });

  // Calculate the new date based on the X position percentage
  const timeRange = endDate - startDate;
  const newDate = new Date(
    startDate.getTime() + (newPosition.x / 100) * timeRange,
  );

  // Create the updated position object with the new date
  const updatedPosition = {
    ...newPosition,
    date: newDate,
  };

  // Call the parent component's onItemMove function with correct parameters
  if (onItemMove) {
    onItemMove(itemId, updatedPosition);
  }
};

export default handleTimelineItemPositionChange;
