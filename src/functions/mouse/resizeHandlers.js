// resizeHandlers.js
import { DRAGGABLE_ITEM } from "../../utils/configConstants";
import { setupDocumentListeners, cleanupDocumentListeners } from "./eventUtils";

/**
 * Creates mouse down handler for resizing
 */
export const createHandleResizeMouseDown = ({
  dragStartPos,
  startSize,
  size,
  setIsResizing,
  handleResizeMouseMove,
  handleResizeMouseUp,
}) => {
  return (e) => {
    // Only start resize on primary mouse button
    if (e.button !== 0) return;

    e.stopPropagation();

    // Save initial position and size
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { width: size.width, height: size.height };

    // Set up event listeners for resize
    setupDocumentListeners({
      moveHandler: handleResizeMouseMove,
      upHandler: handleResizeMouseUp,
      once: true,
    });

    setIsResizing(true);
  };
};

/**
 * Creates mouse move handler for resizing
 */
export const createHandleResizeMouseMove = ({
  dragStartPos,
  startSize,
  setSize,
}) => {
  return (e) => {
    // Calculate new size based on mouse movement
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    // Minimum size constraints
    const minSize = DRAGGABLE_ITEM.MIN_SIZE;
    const newWidth = Math.max(minSize, startSize.current.width + dx);
    const newHeight = Math.max(minSize, startSize.current.height + dy);

    setSize({
      width: newWidth,
      height: newHeight,
    });
  };
};

/**
 * Creates mouse up handler for resizing
 */
export const createHandleResizeMouseUp = ({
  setIsResizing,
  handleResizeMouseMove,
  handleResizeMouseUp,
}) => {
  return () => {
    // Clean up event listeners
    cleanupDocumentListeners({
      moveHandler: handleResizeMouseMove,
      upHandler: handleResizeMouseUp,
    });

    setIsResizing(false);
  };
};
