import TimelineLogger from "../utils/logger";
import sanitizeItemName from "./sanitizeItemName";

/**
 * Updates an item's name on Monday.com using the GraphQL API
 *
 * @param {Object} mondaySDK - The Monday.com SDK instance
 * @param {string} itemId - The ID of the item to update
 * @param {string} boardId - The ID of the board containing the item
 * @param {string} newName - The new name for the item (1-255 characters)
 * @returns {Promise<{success: boolean, error?: string}>} - Result of the update operation
 */
const updateItemName = async (mondaySDK, itemId, boardId, newName) => {
  try {
    // Validate inputs
    if (!mondaySDK) {
      throw new Error("Monday SDK is required");
    }

    if (!itemId || !boardId) {
      throw new Error("Item ID and Board ID are required");
    }

    if (!newName || typeof newName !== "string") {
      throw new Error("New name must be a non-empty string");
    }

    // Trim and validate name length (Monday.com limit is 1-255 characters)
    const trimmedName = newName.trim();
    if (trimmedName.length === 0) {
      throw new Error("Item name cannot be empty");
    }

    if (trimmedName.length > 255) {
      throw new Error("Item name cannot exceed 255 characters");
    }

    const sanitizedItemName = sanitizeItemName(trimmedName);

    TimelineLogger.debug("Updating item name", {
      itemId,
      boardId,
      oldName: "unknown", // We don't have the old name in this context
      newName: sanitizedItemName,
    });

    // Prepare the GraphQL mutation
    const mutation = `
      mutation {
        change_multiple_column_values(
          item_id: ${itemId}, 
          board_id: ${boardId}, 
          column_values: "{\\"name\\": \\"${sanitizedItemName.replace(/"/g, '\\"')}\\"}"
        ) {
          id
          name
        }
      }
    `;

    // Execute the mutation using Monday SDK
    const response = await mondaySDK.api(mutation);

    if (response.errors && response.errors.length > 0) {
      const errorMessage = response.errors.map((err) => err.message).join(", ");
      TimelineLogger.error("Monday.com API returned errors", {
        itemId,
        boardId,
        newName: sanitizedItemName,
        errors: response.errors,
      });
      throw new Error(`Monday.com API error: ${errorMessage}`);
    }

    if (!response.data || !response.data.change_multiple_column_values) {
      TimelineLogger.error("Unexpected response format from Monday.com API", {
        itemId,
        boardId,
        newName: sanitizedItemName,
        response,
      });
      throw new Error("Unexpected response format from Monday.com API");
    }

    const updatedItem = response.data.change_multiple_column_values;

    TimelineLogger.userAction("itemNameUpdated", {
      itemId,
      boardId,
      newName: sanitizedItemName,
      updatedItemId: updatedItem.id,
      updatedItemName: updatedItem.name,
    });

    TimelineLogger.debug("Successfully updated item name", {
      itemId,
      boardId,
      newName: sanitizedItemName,
      updatedItem,
    });

    return {
      success: true,
      updatedItem,
    };
  } catch (error) {
    TimelineLogger.error("Failed to update item name", {
      itemId,
      boardId,
      newName,
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

export default updateItemName;
