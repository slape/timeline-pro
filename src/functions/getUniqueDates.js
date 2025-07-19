/**
 * Extracts unique dates from BoardItems objects
 * @param {Array} boardItems - Array of board items from monday.com
 * @param {string} dateColumn - The ID of the column containing date values
 * @returns {Array} - Array of unique Date objects sorted chronologically
 */
export const getUniqueDates = (boardItems = [], dateColumn) => {
  if (!boardItems || !Array.isArray(boardItems) || !dateColumn) {
    return [];
  }

  const dates = new Set();
  
  boardItems.forEach(item => {
    // Find the date column in the item's column_values
    const column = item.column_values?.find(col => col.id === dateColumn);
    
    if (column?.value) {
      try {
        // Parse the JSON value to extract date information
        const columnValue = JSON.parse(column.value);
        
        if (columnValue && columnValue.date) {
          // Create a Date object from the date and time
          const itemDate = new Date(`${columnValue.date}T${columnValue.time || '00:00:00'}`);
          
          // Only add valid dates
          if (itemDate instanceof Date && !isNaN(itemDate)) {
            // Use ISO string to ensure uniqueness (removes time differences)
            dates.add(itemDate.toISOString().split('T')[0]); // YYYY-MM-DD format
          }
        }
      } catch (error) {
        console.error('Error parsing date value:', error);
      }
    }
  });

  // Convert Set back to array of Date objects and sort chronologically
  return Array.from(dates)
    .map(dateString => new Date(dateString))
    .sort((a, b) => a.getTime() - b.getTime());
};

export default getUniqueDates;
