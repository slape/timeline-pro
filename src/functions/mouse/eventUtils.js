// eventUtils.js

/**
 * Sets up document event listeners for drag or resize operations
 * @param {Object} options - Setup options
 * @param {Function} options.moveHandler - Mouse move handler
 * @param {Function} options.upHandler - Mouse up handler
 * @param {boolean} options.once - Whether to use once option for mouseup
 */
export const setupDocumentListeners = ({
  moveHandler,
  upHandler,
  once = true,
}) => {
  document.addEventListener("mousemove", moveHandler);
  document.addEventListener("mouseup", upHandler, { once });
};

/**
 * Cleans up document event listeners
 * @param {Object} options - Cleanup options
 * @param {Function} options.moveHandler - Mouse move handler to remove
 * @param {Function} options.upHandler - Mouse up handler to remove
 */
export const cleanupDocumentListeners = ({ moveHandler, upHandler }) => {
  document.removeEventListener("mousemove", moveHandler);
  document.removeEventListener("mouseup", upHandler);
};
