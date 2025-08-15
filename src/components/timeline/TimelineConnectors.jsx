import React from "react";
import LeaderLineConnector from "./LeaderLineConnector";
import TimelineLogger from "../../utils/logger";

/**
 * TimelineConnectors component renders leader line connectors between board items and timeline markers
 *
 * @param {Array} visibleTimelineItems - Array of visible timeline items
 * @param {Array} markers - Array of timeline markers
 * @param {Map} itemToMarkerMap - Map connecting items to their corresponding markers
 * @returns {JSX.Element} Timeline connectors
 */
const TimelineConnectors = ({
  visibleTimelineItems,
  markers,
  itemToMarkerMap,
}) => {
  // Early return if no data
  if (
    !visibleTimelineItems?.length ||
    !markers?.length ||
    !itemToMarkerMap?.size
  ) {
    TimelineLogger.debug("[TimelineConnectors] Missing required data", {
      visibleItemsCount: visibleTimelineItems?.length || 0,
      markersCount: markers?.length || 0,
      mapSize: itemToMarkerMap?.size || 0,
    });
    return null;
  }

  // Create connectors for visible items only
  const connectors = visibleTimelineItems
    .map((item) => {
      // Find the corresponding marker for this item
      const markerInfo = itemToMarkerMap.get(item.id);
      if (!markerInfo) return null;

      // Prefer explicit markerIndex if available
      let markerIndex = markerInfo.markerIndex;

      // Fallback 1: parse index from markerId like `marker-<n>`
      if (markerIndex == null && typeof markerInfo.markerId === "string") {
        const m = markerInfo.markerId.match(/marker-(\d+)/);
        if (m) markerIndex = parseInt(m[1], 10);
      }

      // Fallback 2: compute by nearest position
      if (markerIndex == null || isNaN(markerIndex)) {
        markerIndex = markers.findIndex(
          (marker) =>
            Math.abs(marker.position - markerInfo.markerPosition) < 0.5, // widen tolerance
        );
      }

      if (
        markerIndex == null ||
        markerIndex < 0 ||
        markerIndex >= markers.length
      )
        return null;

      return (
        <LeaderLineConnector
          key={`connector-${item.id}`}
          fromId={`board-item-${item.id}`}
          toId={`timeline-marker-${markerIndex}`}
        />
      );
    })
    .filter(Boolean); // Remove null values

  return <>{connectors}</>;
};

export default TimelineConnectors;
