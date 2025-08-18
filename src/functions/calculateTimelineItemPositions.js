/**
 * Calculates positions for timeline items based on chronological order, position settings, and same-date handling
 * @param {Array} items - Array of timeline items with dates
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {string} position - Position setting ('above', 'below', 'alternate')
 * @returns {Array} Array of items with calculated render positions
 */
/**
 * Calculates positions for timeline items based on chronological order, position settings, and same-date handling
 * @param {Array} items - Array of timeline items with dates
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {string} position - Current position setting ('above', 'below', 'alternate')
 * @param {string} [trackedPositionSetting] - Persisted position setting from storage
 * @returns {Array} Array of items with calculated render positions
 */
export function calculateTimelineItemPositions(
  items,
  startDate,
  endDate,
  position,
  trackedPositionSetting = null,
) {
  if (!items || items.length === 0) {
    return [];
  }
  if (trackedPositionSetting && trackedPositionSetting !== position) {
    // Position setting has changed; ignore any custom Y-deltas for this render
    // (If you want to transform/mirror, insert logic here)
    if (typeof TimelineLogger !== "undefined") {
      TimelineLogger.debug("[Y-DELTA][POSITION] Position setting changed, ignoring custom Y-deltas", {
        trackedPositionSetting,
        currentPositionSetting: position,
      });
    }
    // Proceed with default positions only
  }

  // Sort all items chronologically
  const getRawDate = (it) => it?.parsedDate ?? it?.date;
  const sortedItems = items
    .filter((it) => {
      const raw = getRawDate(it);
      const d = raw instanceof Date ? raw : raw ? new Date(raw) : null;
      return d instanceof Date && !isNaN(d);
    })
    .sort((a, b) => new Date(getRawDate(a)) - new Date(getRawDate(b)));

  // Group items by date to handle same-date overlapping
  const itemsByDate = {};
  sortedItems.forEach((item) => {
    const raw = getRawDate(item);
    const d = raw instanceof Date ? raw : new Date(raw);
    const dateKey = d.toDateString();
    if (!itemsByDate[dateKey]) {
      itemsByDate[dateKey] = [];
    }
    itemsByDate[dateKey].push(item);
  });

  // Calculate positions for all items
  const renderedItems = [];
  let globalIndex = 0;

  Object.keys(itemsByDate).forEach((dateKey) => {
    const dateItems = itemsByDate[dateKey];
    const baseDate = new Date(dateKey);

    // Calculate horizontal position based on date
    const timeRange = endDate - startDate;
    const datePosition = ((baseDate - startDate) / timeRange) * 100;

    dateItems.forEach((item, sameDateIndex) => {
      let itemPosition;
      let verticalOffset = 0;

      // Determine position based on setting
      if (position === "above") {
        itemPosition = "above";
        // Reduce vertical offset to bring items closer to the timeline
        // Stack upward with 40px spacing between items (reduced from 50px)
        verticalOffset = -40 - sameDateIndex * 40;
      } else if (position === "below") {
        itemPosition = "below";
        // Reduce vertical offset to bring items closer to the timeline
        // Stack downward with 40px spacing between items (reduced from 50px)
        verticalOffset = 0 + sameDateIndex * 40;
      } else {
        // alternate
        // Alternate between above and below for same-date items
        if (sameDateIndex % 2 === 0) {
          itemPosition = globalIndex % 2 === 0 ? "below" : "above";
        } else {
          itemPosition = globalIndex % 2 === 0 ? "above" : "below";
        }

        // Reduce vertical offset for alternating items to bring them closer to the timeline
        verticalOffset =
          itemPosition === "above"
            ? -160 - sameDateIndex * 40 // Reduced from -150 - (sameDateIndex * 60)
            : 90 + sameDateIndex * 40; // Reduced from 150 + (sameDateIndex * 60)
      }

      // Ensure items stay within display bounds but maintain exact horizontal alignment with date marker
      // For perpendicular connector lines on initial render, keep exact datePosition with no offset
      const finalHorizontalPosition = datePosition; // Exact alignment with date position for perpendicular line

      // Use different max offsets for above and below timeline items
      const maxVerticalOffset =
        itemPosition === "above"
          ? 300 // Increased max offset for items above timeline
          : 120; // Keep smaller offset for items below timeline

      // Only apply minimum bounds check for negative offsets (above timeline)
      const finalVerticalOffset =
        itemPosition === "above"
          ? Math.max(-maxVerticalOffset, verticalOffset) // Only cap negative values
          : Math.min(maxVerticalOffset, verticalOffset); // Only cap positive values

      renderedItems.push({
        ...item,
        renderPosition: {
          x: finalHorizontalPosition,
          y: finalVerticalOffset,
          zIndex: 10 + sameDateIndex, // Higher z-index for overlapping items
        },
      });

      globalIndex++;
    });
  });

  return renderedItems;
}
