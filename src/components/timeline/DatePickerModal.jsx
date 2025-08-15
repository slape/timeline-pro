import React from "react";
import {
  DatePicker,
  Modal,
  Button,
  DialogContentContainer,
  Text,
  AlertBanner,
  AlertBannerText,
} from "@vibe/core";

/**
 * DatePickerModal component for changing item dates
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
  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <>
      {isOpen && (
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
            <DatePicker
              date={selectedDate}
              onPickDate={onDateChange}
              firstDayOfWeek={1}
              data-testid="date-picker"
            />
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
                disabled={!selectedDate}
                size="small"
              >
                Save Date
              </Button>
            </div>
          </DialogContentContainer>
        </Modal>
      )}
    </>
  );
};

export default DatePickerModal;
