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
      console.log('Column value:', column?.value);
      if (column?.value) {
        try {
          const columnValue = JSON.parse(column.value);
          if (columnValue && columnValue.date) {
            itemDate = new Date(`${columnValue.date}T${columnValue.time || '00:00:00'}`);
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
