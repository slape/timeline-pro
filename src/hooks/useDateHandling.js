import { useState } from 'react';
import moment from 'moment';

/**
 * Custom hook to manage date picker and date formatting logic
 * Consolidates all date-related state and operations
 */
export const useDateHandling = (initialDate) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Date validation utility
  const isValidDate = (d) => d instanceof Date && !isNaN(d);

  // Format date for display
  const getFormattedDate = (date) => {
    if (!isValidDate(date)) return null;
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(date);
  };

  // Open date picker with current or default date
  const openDatePicker = (currentDate) => {
    setSelectedDate(currentDate ? moment(currentDate) : moment());
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
    isValidDate,
    getFormattedDate
  };
};
