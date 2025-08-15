import updateItemName from "./updateItemName";
import sanitizeItemName from "./sanitizeItemName";
import TimelineLogger from "../utils/logger";

/**
 * Handles item name change with validation, sanitization, and Monday.com API update
 * @param {Object} params - Parameters object
 * @param {string} params.newName - The new name to set
 * @param {Object} params.item - The timeline item object
 * @param {Object} params.context - The Monday.com context (contains boardId)
 * @param {Object} params.monday - The Monday.com SDK instance
 * @param {Function} params.onLabelChange - Optional callback for successful name changes
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export default async function handleItemNameChange({
  newName,
  item,
  context,
  monday,
  onLabelChange,
}) {
  if (!newName || newName.trim() === "") {
    TimelineLogger.warn("Attempted to set empty item name", {
      itemId: item.id,
    });
    return false;
  }

  const trimmedName = newName.trim();
  const sanitizedName = sanitizeItemName(trimmedName);

  // Check if sanitization resulted in an empty string
  if (!sanitizedName) {
    TimelineLogger.warn("Item name became empty after sanitization", {
      itemId: item.id,
      originalName: newName,
      trimmedName,
    });
    return false;
  }

  // Don't update if the name hasn't actually changed
  if (sanitizedName === item?.originalItem?.name) {
    return true; // No change needed, but not an error
  }

  if (!context?.boardId) {
    TimelineLogger.error("Cannot update item name: board ID not available", {
      itemId: item.id,
      newName: sanitizedName,
    });
    return false;
  }

  TimelineLogger.debug("Updating item name", {
    itemId: item.id,
    boardId: context.boardId,
    oldName: item?.originalItem?.name,
    originalInput: newName,
    sanitizedName: sanitizedName,
  });

  const result = await updateItemName(
    monday,
    item.id,
    context.boardId,
    sanitizedName,
  );

  if (result.success) {
    TimelineLogger.debug("Item name updated successfully", {
      itemId: item.id,
      newName: sanitizedName,
    });

    // Optionally trigger a callback to refresh board data
    // This could be passed as a prop if needed
    onLabelChange?.(item.id, sanitizedName);
    return true;
  } else {
    TimelineLogger.error("Failed to update item name", {
      itemId: item.id,
      newName: sanitizedName,
      error: result.error,
    });

    // You might want to show a toast notification or revert the change
    // For now, we'll just log the error
    return false;
  }
}
