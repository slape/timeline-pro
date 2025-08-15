import getItemsWithDates from "./getItemsWithDates";
import processBoardItems from "./processBoardItems";

/**
 * Processes board items with dates and calculates positions relative to timeline markers
 *
 * @param {Array} boardItems - Array of board items from monday.com
 * @param {string} dateColumn - The ID of the column containing date values
 * @param {Date} startDate - Start date of the timeline
 * @param {Date} endDate - End date of the timeline
 * @param {Object} position - Position configuration object
 * @param {Array} markers - Array of timeline markers with position and date properties
 * @returns {Object} Object containing processedBoardItems and itemToMarkerMap
 */
const processBoardItemsWithMarkers = (
  boardItems,
  dateColumn,
  startDate,
  endDate,
  position,
  markers,
) => {
  // Normalize dateColumn to a string ID to support objects provided by settings/zustand
  let dateColumnId = dateColumn;
  if (dateColumn && typeof dateColumn === "object") {
    if (dateColumn.id) {
      dateColumnId = dateColumn.id;
    } else if (dateColumn.value) {
      dateColumnId = dateColumn.value;
    } else {
      const keys = Object.keys(dateColumn);
      if (keys.length === 1) dateColumnId = keys[0];
    }
  }
  if (dateColumnId == null) dateColumnId = dateColumn;

  // Early return if no board items or date column
  if (!boardItems || boardItems.length === 0 || !dateColumnId) {
    return {
      processedBoardItems: [],
      itemToMarkerMap: new Map(),
    };
  }

  try {
    // Subtask 1: Extract board items with dates
    // First, determine if this is a timeline field by examining the data structure
    let isTimelineField = false;
    if (boardItems && boardItems.length > 0 && dateColumnId) {
      const sampleItem = boardItems.find((item) =>
        item.column_values?.some((col) => col.id === dateColumnId && col.value),
      );

      if (sampleItem) {
        const column = sampleItem.column_values.find(
          (col) => col.id === dateColumnId,
        );
        try {
          const columnValue = JSON.parse(column.value);
          // Check if this has timeline field structure
          isTimelineField = !!(
            columnValue.to ||
            columnValue.end ||
            columnValue.from
          );
        } catch (e) {
          isTimelineField = false;
        }
      }
    }

    const itemsWithDates = getItemsWithDates(
      boardItems,
      dateColumnId,
      isTimelineField,
    );

    if (itemsWithDates.length === 0) {
      return {
        processedBoardItems: [],
        itemToMarkerMap: new Map(),
      };
    }

    // Subtask 2: Calculate positions for each board item relative to the timeline
    const processedItems = processBoardItems(
      itemsWithDates,
      startDate,
      endDate,
      position,
    );

    // Subtask 3: Create item-to-marker mapping
    const itemMarkerMap = new Map();

    processedItems.forEach((item) => {
      // Find the closest marker to this item's timeline position
      const closestMarker = markers.reduce((closest, marker) => {
        const itemDistance = Math.abs(marker.position - item.timelinePosition);
        const closestDistance = Math.abs(
          closest.position - item.timelinePosition,
        );
        return itemDistance < closestDistance ? marker : closest;
      }, markers[0]);

      if (closestMarker) {
        itemMarkerMap.set(item.id, {
          markerId: `marker-${markers.indexOf(closestMarker)}`,
          markerPosition: closestMarker.position,
          markerDate: closestMarker.date,
          itemPosition: item.timelinePosition,
        });
      }
    });

    // console.log('Processed board items:', processedItems);
    // console.log('Item-to-marker mapping:', itemMarkerMap);

    return {
      processedBoardItems: processedItems,
      itemToMarkerMap: itemMarkerMap,
    };
  } catch (error) {
    console.error("Error processing board items:", error);
    return {
      processedBoardItems: [],
      itemToMarkerMap: new Map(),
    };
  }
};

export default processBoardItemsWithMarkers;
