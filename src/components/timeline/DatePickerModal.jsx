import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Modal,
  Button,
  DialogContentContainer,
  Text,
  AlertBanner,
  AlertBannerText,
  Skeleton,
} from "@vibe/core";
import { getCurrentMoment } from "../../functions/dateFormatUtils";

// Lazily load the DatePicker component to prevent render-phase updates
// This creates a code split and only loads the DatePicker when needed
const LazyDatePicker = lazy(() =>
  import("@vibe/core").then((module) => ({
    default: module.DatePicker,
  })),
);

/**
 * DatePickerModal component for changing item dates
 * Uses lazy loading and strict isolation to prevent render-phase warnings
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Handler for closing the modal
 * @param {Object} props.item - The board item data
 * @param {Date|moment} props.selectedDate - Currently selected date
 * @param {Function} props.onDateChange - Handler for date selection changes
 * @param {Function} props.onSave - Handler for saving the selected date
 * @returns {JSX.Element} - Date picker modal component
 */
const DatePickerModal = ({
  isOpen,
  onClose,
  item,
  selectedDate,
  onDateChange,
  onSave,
}) => {
  // Only create state when modal is open to prevent unnecessary renders
  const [internalDate, setInternalDate] = useState(null);
  const [renderDatePicker, setRenderDatePicker] = useState(false);

  // Initialize internal date when modal opens
  useEffect(() => {
    if (isOpen) {
      // Convert to moment when modal opens
      setInternalDate(getCurrentMoment(selectedDate));

      // Add slight delay before rendering DatePicker to prevent React warnings
      setTimeout(() => {
        setRenderDatePicker(true);
      }, 0);
    } else {
      // Cleanup when modal closes
      setRenderDatePicker(false);
      setInternalDate(null);
    }
  }, [isOpen, selectedDate]);

  // Handle local date change
  const handleLocalDateChange = (newDate) => {
    setInternalDate(newDate);
    // Also update parent component
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
  };

  // Handle date save - wait until everything completes before closing
  const handleSave = async () => {
    try {
      // Convert internal date to JavaScript Date for consistency
      const dateToSave = internalDate?.toDate
        ? internalDate.toDate()
        : internalDate;

      // Wait for save to complete
      if (onSave) {
        await onSave(dateToSave);
      }
    } catch (error) {
      console.error("Error saving date:", error);
    } finally {
      // Always close the modal when done
      handleClose();
    }
  };

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    <Modal
      show={isOpen}
      onClose={handleClose}
      title={
        <Text size="text-size-medium" weight="medium">
          Change Date: {item?.originalItem?.name || "Item"}
        </Text>
      }
      size="small"
      width="400px"
    >
      <DialogContentContainer>
        {renderDatePicker ? (
          <Suspense fallback={<Skeleton type="rectangle" height={300} />}>
            <LazyDatePicker
              date={internalDate}
              onPickDate={handleLocalDateChange}
              firstDayOfWeek={1}
              data-testid="date-picker"
            />
          </Suspense>
        ) : (
          <Skeleton type="rectangle" height={300} />
        )}

        <AlertBanner isCloseHidden={true}>
          <AlertBannerText text="Changing this date will update your board." />
        </AlertBanner>

        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <Button onClick={handleClose} kind="tertiary" size="small">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            kind="primary"
            disabled={!internalDate}
            size="small"
          >
            Save Date
          </Button>
        </div>
      </DialogContentContainer>
    </Modal>
  );
};

export default DatePickerModal;
