import React from "react";
import { calculateTimelineItemPositions } from "../../functions/calculateTimelineItemPositions";
import { renderTimelineItems } from "./renderTimelineItems.jsx";
import {
  calculateTimelineLayout,
  TIMELINE_CONTAINER_STYLES,
} from "../../functions/calculateTimelineLayout";
import TimelineLogger from "../../utils/logger";
import { useZustandStore } from "../../store/useZustand";

// Custom hooks
import { useTimelineSettings } from "../../hooks/useTimelineSettings";
import { useTimelineData } from "../../hooks/useTimelineData";
import { useTimelineMarkers } from "../../hooks/useTimelineMarkers";
import { useTimelineCallbacks } from "../../hooks/useTimelineCallbacks";
import { useDynamicTimelineDates } from "../../hooks/useDynamicTimelineDates";
import { useDynamicScaleMarkers } from "../../hooks/useDynamicScaleMarkers";

// Timeline subcomponents
import TimelineLine from "./TimelineLine";
import TimelineMarkers from "./TimelineMarkers";
import TimelineScaleMarkers from "./TimelineScaleMarkers";
import TimelineConnectors from "./TimelineConnectors";

/**
 * Timeline component that displays a horizontal timeline with markers and draggable items
 *
 * @param {Function} onItemMove - Callback when an item is moved
 * @param {Function} onHideItem - Callback when an item is hidden/removed
 * @param {Function} onLabelChange - Callback when an item's label is changed
 * @returns {JSX.Element} - Timeline component
 */

const Timeline = ({ onItemMove, onHideItem, onLabelChange }) => {
  // Access Zustand store for position setting change detection
  const { updatePositionSetting, currentPositionSetting } = useZustandStore();

  // Extract timeline settings
  const {
    startDate,
    endDate,
    dateColumn,
    dateFormat,
    datePosition,
    position,
    scale,
  } = useTimelineSettings();

  // Debug logging
  TimelineLogger.debug("Start/End date types", {
    startType: typeof startDate,
    startDate,
    endType: typeof endDate,
    endDate,
  });

  // Get timeline data using original dates
  const { visibleBoardItems, visibleTimelineItems, visibleBoardItemsString } =
    useTimelineData(startDate, endDate, scale);

  // Debug logging for timeline data
  React.useEffect(() => {
    TimelineLogger.debug("🔍 Timeline component data check", {
      visibleBoardItemsCount: visibleBoardItems?.length || 0,
      visibleTimelineItemsCount: visibleTimelineItems?.length || 0,
      hasStartDate: !!startDate,
      hasEndDate: !!endDate,
      scale,
    });
  }, [visibleBoardItems, visibleTimelineItems, startDate, endDate, scale]);

  // Calculate dynamic dates based on visible items to prevent empty space at edges
  const {
    startDate: dynamicStartDate,
    endDate: dynamicEndDate,
    isAdjusted,
  } = useDynamicTimelineDates(visibleTimelineItems, startDate, endDate);

  // Debug logging for dynamic dates
  React.useEffect(() => {
    TimelineLogger.debug("🔍 Dynamic dates calculation", {
      originalStart: startDate?.toISOString(),
      originalEnd: endDate?.toISOString(),
      dynamicStart: dynamicStartDate?.toISOString(),
      dynamicEnd: dynamicEndDate?.toISOString(),
      isAdjusted,
      visibleTimelineItemsCount: visibleTimelineItems?.length || 0,
    });
  }, [
    startDate,
    endDate,
    dynamicStartDate,
    dynamicEndDate,
    isAdjusted,
    visibleTimelineItems,
  ]);

  // Detect position setting changes and trigger reset
  React.useEffect(() => {
    TimelineLogger.debug("🔍 Position change detection check", {
      position,
      currentPositionSetting,
      positionType: typeof position,
      currentPositionSettingType: typeof currentPositionSetting,
      areEqual: position === currentPositionSetting,
      willTriggerReset: position && position !== currentPositionSetting,
    });

    if (position && position !== currentPositionSetting) {
      TimelineLogger.debug("🔄 Position setting changed, triggering reset", {
        from: currentPositionSetting,
        to: position,
      });
      updatePositionSetting(position);
    }
  }, [position, currentPositionSetting, updatePositionSetting]);

  // Use dynamic dates for all timeline calculations
  const effectiveStartDate = dynamicStartDate;
  const effectiveEndDate = dynamicEndDate;

  // Calculate dynamic scale markers based on effective dates
  const dynamicScaleMarkers = useDynamicScaleMarkers(
    effectiveStartDate,
    effectiveEndDate,
    scale,
    isAdjusted,
  );

  // Log when dates are adjusted
  if (isAdjusted) {
    TimelineLogger.debug("Timeline dates adjusted for visible items", {
      originalStart: startDate?.toISOString(),
      originalEnd: endDate?.toISOString(),
      adjustedStart: effectiveStartDate?.toISOString(),
      adjustedEnd: effectiveEndDate?.toISOString(),
      visibleItemCount: visibleTimelineItems?.length || 0,
    });
  }

  // Get timeline markers and mappings using effective dates
  const { markers, itemToMarkerMap } = useTimelineMarkers({
    visibleBoardItems,
    visibleTimelineItems,
    dateColumn,
    startDate: effectiveStartDate,
    endDate: effectiveEndDate,
    dateFormat,
    position,
    startDateString: effectiveStartDate?.toISOString(),
    endDateString: effectiveEndDate?.toISOString(),
    visibleBoardItemsString,
  });

  // Debug logging for timeline markers
  React.useEffect(() => {
    TimelineLogger.debug("🔍 Timeline markers generated", {
      markersCount: markers?.length || 0,
      itemToMarkerMapSize: itemToMarkerMap?.size || 0,
      effectiveStart: effectiveStartDate?.toISOString(),
      effectiveEnd: effectiveEndDate?.toISOString(),
      visibleBoardItemsCount: visibleBoardItems?.length || 0,
    });
  }, [
    markers,
    itemToMarkerMap,
    effectiveStartDate,
    effectiveEndDate,
    visibleBoardItems,
  ]);

  // Get callback functions using effective dates
  const { onPositionChange } = useTimelineCallbacks(
    effectiveStartDate,
    effectiveEndDate,
    onItemMove,
  );

  // Calculate layout values
  const { shouldFlipScaleMarkers, timelineTop } = calculateTimelineLayout(
    position,
    datePosition,
  );

  return (
    <div className="timeline-container" style={TIMELINE_CONTAINER_STYLES}>
      {/* Timeline line */}
      <TimelineLine position={position} />

      {/* Timeline markers */}
      <TimelineMarkers
        markers={markers}
        datePosition={datePosition}
        timelineTop={timelineTop}
      />

      {/* Scale markers */}
      <TimelineScaleMarkers
        scale={scale}
        scaleMarkers={dynamicScaleMarkers}
        timelineTop={timelineTop}
        shouldFlipScaleMarkers={shouldFlipScaleMarkers}
      />

      {/* Board Items - Render all items chronologically with position logic */}
      {(() => {
        // Calculate positions for all items using effective dates
        const itemsWithPositions = calculateTimelineItemPositions(
          visibleTimelineItems,
          effectiveStartDate,
          effectiveEndDate,
          position,
        );
        TimelineLogger.debug("itemsWithPositions", itemsWithPositions);
        // Render items using extracted function
        return renderTimelineItems(
          itemsWithPositions,
          onLabelChange,
          onHideItem,
          onPositionChange,
        );
      })()}

      {/* LeaderLine Connectors - Connect board items to timeline markers */}
      <TimelineConnectors
        visibleTimelineItems={visibleTimelineItems}
        markers={markers}
        itemToMarkerMap={itemToMarkerMap}
      />
    </div>
  );
};

export default Timeline;
