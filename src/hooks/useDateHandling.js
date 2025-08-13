import { useState } from 'react';
import { formatDateForDisplay, getCurrentMoment } from '../functions/dateFormatUtils';

/**
 * Custom hook to manage date picker and date formatting logic
 * Consolidates all date-related state and operations
 */
export const useDateHandling = (initialDate) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Format date for display using centralized utility
  const getFormattedDate = (date) => {
    return formatDateForDisplay(date);
  };

  // Open date picker with current or default date
  const openDatePicker = (currentDate) => {
    setSelectedDate(getCurrentMoment(currentDate));
    setIsDatePickerOpen(true);
  };

  // Close date picker and reset
  const closeDatePicker = () => {
    setIsDatePickerOpen(false);
    setSelectedDate(null);
  };

  // Handle date selection
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  return {
    // State
    isDatePickerOpen,
    selectedDate,
    
    // Actions
    openDatePicker,
    closeDatePicker,
    handleDateChange,
    setIsDatePickerOpen,
    setSelectedDate,
    
    // Utilities
    getFormattedDate
  };
};
