import React from 'react';
import DraggableBoardItem from '../components/timeline/DraggableBoardItem.jsx';

/**
 * Maps board items to DraggableBoardItem components, sorted by date.
 * 
 * @param {Array} boardItems - Array of board items from monday.com
 * @param {Object} options - Additional options for rendering
 * @param {Function} options.onItemClick - Click handler for board items
 * @param {Object} options.customStyles - Custom styles to apply to items
 * @param {string} options.dateColumnId - Column ID of the date column
 * @returns {Array} - Array of DraggableBoardItem components sorted by date
 */
const mapBoardItemsToComponents = (boardItems = [], options = {}) => {
  const { onItemClick, customStyles = {}, dateColumnId } = options;
  
  if (!boardItems || !Array.isArray(boardItems) || boardItems.length === 0) {
    return [];
  }

  if (!dateColumnId) {
    console.warn('No dateColumnId provided in options.');
    return [];
  }

  // Process and sort items by parsed date
  const sortedItems = boardItems
    .map(item => {
      const column = item.column_values.find(col => col.id === dateColumnId);
      const columnValue = column?.value ? JSON.parse(column.value) : null;

      const parsedDate = columnValue && columnValue.date
        ? new Date(`${columnValue.date}T${columnValue.time || '00:00:00'}`)
        : null;

      return { ...item, parsedDate };
    })
    .filter(item => item.parsedDate)
    .sort((a, b) => a.parsedDate - b.parsedDate);

  // Map to components
  return sortedItems.map((item) =>
    React.createElement(
      DraggableBoardItem,
      {
        key: item.id,
        item: item,
        date: item.parsedDate, // <-- New prop: parsed date
        onClick: onItemClick ? () => onItemClick(item) : undefined,
        style: customStyles
      }
    )
  );
};

export default mapBoardItemsToComponents;
