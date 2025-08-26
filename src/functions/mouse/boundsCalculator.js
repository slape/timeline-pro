// boundsCalculator.js
import TimelineLogger from "../../utils/logger";
import {
  DRAGGABLE_ITEM,
  TIMELINE_LAYOUT,
  getTimelinePositionRatio,
} from "../../utils/configConstants";

/**
 * Calculate drag bounds based on timeline position and container dimensions
 * @param {Object} params - Calculation parameters
 * @param {Object} params.containerRect - Container bounding rectangle
 * @param {Object} params.itemRect - Item bounding rectangle
 * @param {string} params.timelinePosition - Timeline position setting
 * @param {Object} params.item - Item data for logging
 * @returns {Object} Bounds object with minX, maxX, minY, maxY
 */
export const calculateDragBounds = ({
  containerRect,
  itemRect,
  timelinePosition,
  item,
}) => {
  // Enhanced bounds calculation accounting for item size and timeline position
  const PADDING = DRAGGABLE_ITEM.CONTAINER_PADDING; // Minimum padding from container edges
  const itemWidth = itemRect.width;

  // Calculate timeline position within container
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

  const timelineRatio = getTimelinePosition(timelinePosition);
  const timelinePixelPosition = containerRect.height * timelineRatio;

  // Calculate position-aware Y bounds relative to timeline position
  const containerTop = DRAGGABLE_ITEM.CONTAINER_TOP_REFERENCE;
  const containerBottom = containerRect.height;

  // Y bounds are relative to timeline position, with position-specific constraints
  let minYFromTimeline, maxYFromTimeline;

  if (timelinePosition === "above") {
    // For 'above' position logic
    minYFromTimeline = -DRAGGABLE_ITEM.ABOVE_MAX_DISTANCE_UP;
    const availableSpaceBelow =
      containerBottom -
      timelinePixelPosition -
      DRAGGABLE_ITEM.ABOVE_BOTTOM_BUFFER;
    maxYFromTimeline = Math.min(
      availableSpaceBelow,
      DRAGGABLE_ITEM.ABOVE_MAX_DISTANCE_DOWN,
    );

    TimelineLogger.debug("🔍 ABOVE BOUNDS", {
      itemId: item?.id,
      minY: minYFromTimeline,
      maxY: maxYFromTimeline,
    });
  } else if (timelinePosition === "below") {
    // For 'below' position logic
    const availableSpaceAbove =
      timelinePixelPosition - containerTop - DRAGGABLE_ITEM.BELOW_TOP_BUFFER;
    minYFromTimeline = Math.max(
      -availableSpaceAbove,
      -DRAGGABLE_ITEM.BELOW_MAX_DISTANCE_UP,
    );
    maxYFromTimeline = DRAGGABLE_ITEM.BELOW_MAX_DISTANCE_DOWN;
  } else if (timelinePosition === "alternate") {
    // For 'alternate' position logic
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
  } else {
    // For 'center' position
    minYFromTimeline = Math.max(
      containerTop - timelinePixelPosition,
      -DRAGGABLE_ITEM.MAX_DRAG_DISTANCE,
    );
    maxYFromTimeline = Math.min(
      containerBottom - timelinePixelPosition,
      DRAGGABLE_ITEM.MAX_DRAG_DISTANCE,
    );
  }

  // Return the calculated bounds
  return {
    minX: PADDING,
    maxX: containerRect.width - itemWidth - PADDING,
    minY: minYFromTimeline,
    maxY: maxYFromTimeline,
  };
};
