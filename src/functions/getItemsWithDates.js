import TimelineLogger from "../utils/logger";

/**
 * Processes board items to extract items with valid dates from a specified column
 * @param {Array} boardItems - The board items to process
 * @param {String} dateColumn - The ID of the column containing date values
 * @param {Boolean} isTimelineField - Whether this is a timeline/timeline range field
 * @returns {Array} - Filtered array of items with valid dates
 */
export const getItemsWithDates = (
  boardItems,
  dateColumn,
  isTimelineField = false,
) => {
  const startTime = Date.now();
  const processedItems = boardItems
    .map((item) => {
      const column = item.column_values?.find((col) => col.id === dateColumn);
      let itemDate = null;

      if (column?.value) {
        try {
          const columnValue = JSON.parse(column.value);

          if (isTimelineField && columnValue) {
            // Handle timeline/timeline range fields
            // Use the 'to' or 'end' date as the timeline position
            let endDateStr = null;

            if (columnValue.to) {
              endDateStr = columnValue.to;
            } else if (columnValue.end) {
              endDateStr = columnValue.end;
            } else if (columnValue.from) {
              // Fallback to 'from' if 'to'/'end' not available
              endDateStr = columnValue.from;
            }

            if (endDateStr) {
              const [year, month, day] = endDateStr.split("-").map(Number);
              itemDate = new Date(year, month - 1, day, 0, 0, 0);

              TimelineLogger.debug("Timeline end date parsed successfully", {
                itemId: item.id,
                endDateStr,
                parsedDate: itemDate.toISOString(),
                isTimelineField: true,
                availableFields: Object.keys(columnValue),
              });
            }
          } else if (columnValue && columnValue.date) {
            // Handle regular date fields
            const dateStr = columnValue.date;
            const timeStr = columnValue.time || "00:00:00";
            const [year, month, day] = dateStr.split("-").map(Number);
            const [hours, minutes, seconds] = timeStr.split(":").map(Number);
            itemDate = new Date(
              year,
              month - 1,
              day,
              hours || 0,
              minutes || 0,
              seconds || 0,
            );

            TimelineLogger.debug("Regular date parsed successfully", {
              itemId: item.id,
              dateStr,
              timeStr,
              parsedDate: itemDate.toISOString(),
              isTimelineField: false,
            });
          }
        } catch (e) {
          TimelineLogger.warn("Date parsing failed", {
            itemId: item.id,
            columnValue: column.value,
            error: e.message,
            isTimelineField,
          });
        }
      }

      return {
        id: item.id,
        label: item.name,
        date: itemDate,
        originalItem: item,
        isTimelineField, // Store this for potential use in timeline rendering
      };
    })
    .filter((item) => item.date instanceof Date && !isNaN(item.date));

  const duration = Date.now() - startTime;
  TimelineLogger.performance("getItemsWithDates.complete", duration, {
    inputCount: boardItems.length,
    outputCount: processedItems.length,
    dateColumn,
    isTimelineField,
    successRate: Math.round((processedItems.length / boardItems.length) * 100),
  });

  return processedItems;
};

export default getItemsWithDates;
