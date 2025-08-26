import React from "react";
import DraggableBoardItem from "./DraggableBoardItem";
import TimelineLogger from "../../utils/logger";
import { useZustandStore } from "../../store/useZustand";

/**
 * Renders timeline items as JSX elements with proper positioning
 * @param {Array} itemsWithPositions - Array of items with calculated render positions
 * @param {Function} onLabelChange - Callback for label change events
 * @param {Function} onHideItem - Callback for removing items
 * @param {Function} onPositionChange - Callback for when an item's position changes
 * @returns {Array} Array of JSX elements for timeline items
 */
export function renderTimelineItems(
  itemsWithPositions,
  onLabelChange,
  onHideItem,
  onPositionChange = () => {},
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { settings, hiddenItemIds } = useZustandStore();
  const shape = settings?.shape;
  // Support new settings key `itemDates`; fall back to legacy `showItemDates`
  const showDates = settings?.itemDates ?? settings?.showItemDates ?? true;

  // Debug logging to track hidden items
  // console.log('renderTimelineItems - hiddenItemIds:', hiddenItemIds); // Suppressed for focused debugging
  // console.log('renderTimelineItems - itemsWithPositions count:', itemsWithPositions?.length); // Suppressed for focused debugging

  TimelineLogger.debug(`[POSITION][UI] renderTimelineItems called`, {
    hiddenItemIds,
    itemsWithPositions: itemsWithPositions.map((i) => i.id),
  });
  TimelineLogger.debug(`[POSITION][UI] renderTimelineItems called`, {
    hiddenItemIds,
    itemsWithPositions: itemsWithPositions.map((i) => i.id),
  });
  TimelineLogger.debug(`[POSITION][UI] renderTimelineItems called`, {
    hiddenItemIds,
    itemsWithPositions: itemsWithPositions.map((i) => i.id),
  });
  return itemsWithPositions.map((item) => {
    // Support either `parsedDate` (new) or `date` (legacy)
    const raw = item.parsedDate ?? item.date;
    // Preserve Date instances from processed data; only construct if needed
    const itemDate = raw instanceof Date ? raw : raw ? new Date(raw) : null;
    const isValidDate = (d) => d instanceof Date && !isNaN(d);

    // Check if this item should be hidden
    const isHidden = hiddenItemIds?.includes(item.id);

    // Ensure the item has a valid renderPosition
    if (!item.renderPosition) {
      TimelineLogger.error("[RENDER] Item missing renderPosition", {
        itemId: item.id,
        item: JSON.stringify(item),
      });

      // Create a default renderPosition to avoid rendering errors
      item.renderPosition = {
        x: 50, // Center horizontally
        y: 0, // Default vertical position
        zIndex: 10,
      };
    }

    TimelineLogger.debug("[POSITION-DEBUG] Calculating render position", {
      itemId: item.id,
      itemX: item.renderPosition.x,
      finalY: item.renderPosition.y,
      connectorY: item.connectorY,
    });

    // Create a container for the item and a hidden connector anchor
    return (
      <React.Fragment key={item.id}>
        {/* Hidden connector anchor point - uses the original calculated position for proper alignment */}
        <div
          id={`board-item-${item.id}`}
          className="connector-anchor"
          style={{
            position: "absolute",
            left: `${item.renderPosition.x}%`,
            // Position at the timeline center, then apply offset
            top: "50%", // Always start at the timeline centerline
            width: "4px", // Slightly larger to make it easier to hit
            height: "4px", // Slightly larger to make it easier to hit
            pointerEvents: "none",
            backgroundColor: "rgba(0,0,0,0)", // Completely transparent
            opacity: 0, // Make completely invisible
            zIndex: 5, // Higher z-index to ensure visibility
            // Apply transform to keep it aligned with the draggable item
            transform: `translateY(${item.renderPosition.y || 0}px)`,
            // Ensure it stays visible during drag operations
            willChange: "transform",
          }}
          data-item-id={item.id} // Add data attribute for easier debugging
          data-position-y={item.renderPosition.y} // Store original Y for debugging
          data-final-position={item.renderPosition.y} // Store the position for connector line
          data-active="true" // Mark as active for connector updates
          data-item-center="true" // Mark this as an item center anchor
        />

        {/* Main draggable item - this is what users see and interact with */}
        <div
          key={`item-wrapper-${item.id}`}
          style={{
            position: "absolute",
            left: `${item.renderPosition.x}%`,
            top: `calc(50% + ${item.renderPosition.y}px)`,
            zIndex: item.renderPosition.zIndex,
            display: isHidden ? "none" : "block",
            transform: "translateX(-50%)", // Center the item on its position
            textAlign: "center",
          }}
        >
          <DraggableBoardItem
            key={`${item.id}-${settings?.position || "default"}`}
            item={item}
            date={isValidDate(itemDate) ? itemDate : null}
            shape={shape}
            onLabelChange={(itemId, newLabel) =>
              onLabelChange?.(itemId, newLabel)
            }
            onHideItem={onHideItem}
            showItemDates={showDates}
            onPositionChange={onPositionChange}
            itemsForDefaultY={itemsWithPositions}
          />
        </div>
      </React.Fragment>
    );
  });
}
