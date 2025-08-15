import moment from 'moment';
import TimelineLogger from '../utils/logger';
import updateItemDate from './updateItemDate';
import { 
  validateDateInput, 
  formatDateForAPI, 
  createColumnValue 
} from './dateFormatUtils';

/**
 * Handles saving a selected date for a timeline item
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.item - The board item data from monday.com
 * @param {Date|moment} params.selectedDate - The selected date to save
 * @param {Object} params.settings - Timeline settings containing dateColumn configuration
 * @param {Object} params.context - Monday.com context containing boardId
 * @param {Object} params.monday - Monday SDK instance
 * @param {Function} params.updateBoardItemDate - Function to update local store
 * @param {Function} params.setIsDatePickerOpen - Function to close date picker modal
 * @param {Function} params.setSelectedDate - Function to clear selected date
 * @param {Function} params.onLabelChange - Optional callback for date changes
 * @param {Date} params.date - Current date for logging purposes
 * @returns {Promise<void>}
 */
export default async function handleSaveDate({
  item,
  selectedDate,
  settings,
  context,
  monday,
  updateBoardItemDate,
  setIsDatePickerOpen,
  setSelectedDate,
  onLabelChange,
  date
}) {
  try {
    TimelineLogger.debug('🎯 handleSaveDate called', { 
      itemId: item.id, 
      selectedDate: selectedDate,
      selectedDateType: typeof selectedDate,
      isMoment: moment.isMoment(selectedDate)
    });
    
    // Validate and convert date using centralized utility
    const validation = validateDateInput(selectedDate);
    if (!validation.isValid) {
      TimelineLogger.warn('Invalid date selected', { 
        itemId: item.id, 
        error: validation.error 
      });
      return;
    }
    
    const dateToUpdate = validation.date;
    
    TimelineLogger.debug('🎯 Date validation and conversion completed', { 
      itemId: item.id, 
      originalSelectedDate: selectedDate,
      dateToUpdate: dateToUpdate,
      validationResult: validation
    });
  
    // Extract date column ID (handle both string and object formats)
    let dateColumnId;
    if (settings?.dateColumn) {
      if (typeof settings.dateColumn === 'string') {
        dateColumnId = settings.dateColumn;
      } else if (typeof settings.dateColumn === 'object') {
        // Handle object format like { date_column_id: true }
        const keys = Object.keys(settings.dateColumn);
        dateColumnId = keys.length === 1 ? keys[0] : undefined;
      }
    }
    
    if (!dateColumnId) {
      TimelineLogger.error('Cannot update item date: date column not available', { 
        itemId: item.id, 
        newDate: dateToUpdate,
        dateColumn: settings?.dateColumn,
        dateColumnType: typeof settings?.dateColumn
      });
      return;
    }
    
    // Get column type from the item's column_values data
    let columnType = 'date'; // Default fallback
    let currentColumnValue = null; // Store the current column value for timeline updates
    
    TimelineLogger.debug('Column type detection debug', {
      itemId: item.id,
      dateColumnId: dateColumnId,
      hasOriginalItem: !!item?.originalItem,
      hasColumnValues: !!item?.originalItem?.column_values,
      columnValuesCount: item?.originalItem?.column_values?.length || 0,
      allColumnIds: item?.originalItem?.column_values?.map(col => ({ id: col.id, type: col.type })) || []
    });
    
    if (item?.originalItem?.column_values) {
      const columnValue = item.originalItem.column_values.find(col => col.id === dateColumnId);
      TimelineLogger.debug('Found column value for date column', {
        dateColumnId: dateColumnId,
        foundColumn: !!columnValue,
        columnId: columnValue?.id,
        columnType: columnValue?.type,
        columnValue: columnValue,
        columnValueText: columnValue?.text,
        columnValueValue: columnValue?.value,
        columnValueParsed: columnValue?.value ? JSON.parse(columnValue.value) : null
      });
      
      if (columnValue?.type) {
        columnType = columnValue.type;
        currentColumnValue = columnValue; // Store for timeline updates
      }
    }
    
    if (!context?.boardId) {
      TimelineLogger.error('Cannot update item date: board ID not available', { 
        itemId: item.id, 
        newDate: dateToUpdate 
      });
      return;
    }
    
    TimelineLogger.debug('Updating item date - handleSaveDate', {
      itemId: item.id,
      boardId: context.boardId,
      dateColumn: settings.dateColumn,
      dateColumnId: dateColumnId,
      columnType: columnType,
      dateColumnType: typeof settings.dateColumn,
      oldDate: date,
      newDate: dateToUpdate,
      selectedDate: selectedDate,
      selectedDateType: typeof selectedDate,
      momentCheck: moment.isMoment(selectedDate),
      settings: settings,
      context: context
    });
    
    const result = await updateItemDate(monday, item.id, context.boardId, dateColumnId, dateToUpdate, columnType, null, currentColumnValue);
    
    TimelineLogger.debug('updateItemDate result', {
      itemId: item.id,
      result: result,
      success: result.success,
      error: result.error
    });
    
    if (result.success) {
      TimelineLogger.debug('Item date updated successfully', {
        itemId: item.id,
        newDate: dateToUpdate
      });
      
      // Close the date picker modal
      setIsDatePickerOpen(false);
      setSelectedDate(null);
      
      // Update the local board item data in the zustand store
      // This will cause the timeline to re-render automatically with the new date
      
      // Create column value using centralized utility
      const newColumnValue = createColumnValue(dateToUpdate, columnType, currentColumnValue);
      
      if (!newColumnValue) {
        TimelineLogger.error('Failed to create column value for local store update', { 
          dateToUpdate, 
          columnType, 
          currentColumnValue 
        });
        return;
      }
        
      updateBoardItemDate(item.id, dateColumnId, newColumnValue);
      
      TimelineLogger.debug('Updated local board item data, timeline should re-render automatically', {
        itemId: item.id,
        columnId: dateColumnId,
        newDate: dateToUpdate,
        newColumnValue: newColumnValue,
        formattedDate: formatDateForAPI(dateToUpdate)
      });
      
      // Optionally trigger a callback to refresh timeline data
      // This could be passed as a prop if needed
      onLabelChange?.(item.id, dateToUpdate);
    } else {
      TimelineLogger.error('Failed to update item date', {
        itemId: item.id,
        newDate: dateToUpdate,
        error: result.error
      });
      
      // You might want to show a toast notification or revert the change
      // For now, we'll just log the error
    }
    
  } catch (error) {
    TimelineLogger.error('🚨 Exception in handleSaveDate', {
      itemId: item.id,
      error: error.message,
      stack: error.stack,
      selectedDate: selectedDate,
      settings: settings,
      context: context
    });
    
    // Close modal on error to prevent it from being stuck open
    setIsDatePickerOpen(false);
    setSelectedDate(null);
  }
}
