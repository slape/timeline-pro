import React from "react";
import { calculateTimelineItemPositions } from "../../functions/calculateTimelineItemPositions";
import { renderTimelineItems } from "./renderTimelineItems.jsx";
import {
  calculateTimelineLayout,
  TIMELINE_CONTAINER_STYLES,
} from "../../functions/calculateTimelineLayout";
import TimelineLogger from "../../utils/logger";
import { useZustandStore } from "../../store/useZustand";
import "./TimelineEvents.css";

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

// Import missing functions
import { initializeItemPositions } from "../../functions/initializeItemPositions";
import { migrateLegacyYDeltaToRowShift } from "../../functions/migrateLegacyYDeltaToRowShift";
import initializeConnectorPositions from "../../functions/initializeConnectorPositions";

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

  const { sdkReady, boardId, itemsReady, customItemY } = useZustandStore();
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

  // Dedicated effect to handle initialization logic
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    setIsInitialized(true); // Mark the app as initialized after the first render
  }, []);

  React.useEffect(() => {
    // Ensure the app is fully initialized before executing this effect
    if (!isInitialized) return;

    if (position && position !== currentPositionSetting) {
      TimelineLogger.debug("🔄 Position setting changed, triggering reset", {
        from: currentPositionSetting,
        to: position,
      });
      updatePositionSetting(position);

      // Dispatch a custom event to notify connector lines about the position change
      const updateEvent = new CustomEvent("timeline-setting-changed", {
        bubbles: true,
        detail: {
          setting: "position",
          from: currentPositionSetting,
          to: position,
        },
      });
      document.dispatchEvent(updateEvent);

      // Force all connector anchors to update their positions
      setTimeout(() => {
        // Get all connector anchors
        const connectorAnchors = document.querySelectorAll(".connector-anchor");

        // Reset their transforms to ensure they're properly positioned
        connectorAnchors.forEach((anchor) => {
          // Get the corresponding timeline item's current transform
          const itemId = anchor.dataset.itemId;
          if (itemId) {
            const item = document.querySelector(`[data-item-id="${itemId}"]`);
            if (item) {
              // Apply the same transform from the item to the anchor
              anchor.style.transform = item.style.transform || "";
            }
          }
        });
      }, 50); // Small delay to ensure DOM has updated
    }
  }, [position, currentPositionSetting, updatePositionSetting]); // Removed `isInitialized` from dependencies

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

  React.useEffect(() => {
    // Initialize item positions on component mount if we have a boardId
    const { initializeItemPositions } = useZustandStore.getState();
    if (boardId) {
      initializeItemPositions(boardId);
    }
  }, [boardId]);

  React.useEffect(() => {
    if (sdkReady && boardId) initializeItemPositions(boardId);
  }, [sdkReady, boardId]);

  React.useEffect(() => {
    if (!itemsReady || !boardId) return;
    if (window.__LEGACY_YDELTA__) {
      const monday = useZustandStore.getState().monday;
      migrateLegacyYDeltaToRowShift({
        boardId,
        items: visibleTimelineItems,
        positionSetting: currentPositionSetting,
        monday,
      });
    }
  }, [itemsReady, boardId, currentPositionSetting]);

  // We no longer need to run resolveItemPositions separately
  // We'll use the output of calculateTimelineItemPositions directly

  // Prepare itemsWithPositions outside the rendering JSX
  const itemsWithPositions = React.useMemo(() => {
    // Calculate positions for all items using effective dates
    // This now incorporates the row/lane shift model directly
    const positions = calculateTimelineItemPositions(
      visibleTimelineItems,
      effectiveStartDate,
      effectiveEndDate,
      position,
      currentPositionSetting, // tracked position setting
      customItemY, // row/lane shift model
    );

    TimelineLogger.debug("[TIMELINE] Items with positions", {
      count: positions.length,
      sample:
        positions.length > 0
          ? {
              id: positions[0].id,
              x: positions[0].renderPosition?.x,
              y: positions[0].renderPosition?.y,
            }
          : null,
    });

    return positions;
  }, [
    visibleTimelineItems,
    effectiveStartDate,
    effectiveEndDate,
    position,
    currentPositionSetting,
    customItemY,
  ]);

  // Initialize connector positions when items are rendered
  React.useEffect(() => {
    if (itemsWithPositions.length > 0) {
      // Use small delay to ensure DOM has rendered
      const initTimer = setTimeout(() => {
        initializeConnectorPositions();

        // Trigger a global connector update
        const updateEvent = new CustomEvent("timeline-connector-update", {
          bubbles: true,
          detail: {
            isInitializing: true,
          },
        });
        document.dispatchEvent(updateEvent);
      }, 200);

      return () => clearTimeout(initTimer);
    }
  }, [itemsWithPositions.length]);

  return (
    <div
      className="timeline-container"
      style={{
        ...TIMELINE_CONTAINER_STYLES,
        // Fix position to ensure it doesn't move
        position: "relative",
        // Ensure events don't propagate beyond this container
        touchAction: "none",
      }}
      onMouseDown={(e) => {
        // Always prevent default to stop unwanted dragging
        e.preventDefault();
        e.stopPropagation();

        // Check if the event originated from a draggable item
        // If it has our custom flag, don't interfere with the drag
        if (
          e.target.closest(".draggable-board-item") ||
          (e.nativeEvent && e.nativeEvent._handledByDraggableItem)
        ) {
          return; // Allow draggable items to handle their own events
        }
      }}
    >
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
      {renderTimelineItems(
        itemsWithPositions,
        onLabelChange,
        onHideItem,
        onPositionChange,
      )}

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
