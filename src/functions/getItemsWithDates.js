/**
 * Processes board items to extract items with valid dates from a specified column
 * @param {Array} boardItems - The board items to process
 * @param {String} dateColumn - The ID of the column containing date values
 * @returns {Array} - Filtered array of items with valid dates
 */
export const getItemsWithDates = (boardItems, dateColumn) => {
  return boardItems
    .map(item => {
      const column = item.column_values?.find(col => col.id === dateColumn);
      let itemDate = null;
      // console.log('Column value:', column?.value);
      if (column?.value) {
        try {
          const columnValue = JSON.parse(column.value);
          if (columnValue && columnValue.date) {
            // Create date string in UTC to prevent timezone-related date shifting
            const dateStr = columnValue.date;
            const timeStr = columnValue.time || '00:00:00';
            // Parse the date parts manually to avoid timezone issues
            const [year, month, day] = dateStr.split('-').map(Number);
            const [hours, minutes, seconds] = timeStr.split(':').map(Number);
            // Create date in local timezone
            itemDate = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
            // console.log('Parsed date:', { dateStr, timeStr, localDate: itemDate });
          }
        } catch (e) {
          console.error('Error parsing date value:', e);
        }
      }
      
      return {
        id: item.id,
        label: item.name,
        date: itemDate,
        originalItem: item
      };
    })
    .filter(item => item.date instanceof Date && !isNaN(item.date));
};

export default getItemsWithDates;
