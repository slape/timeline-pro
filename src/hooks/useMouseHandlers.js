import React from "react";
import {
  createHandleMouseDown,
  createHandleMouseMove,
  createHandleMouseUp,
  createHandleResizeMouseDown,
  createHandleResizeMouseMove,
  createHandleResizeMouseUp,
} from "../functions/draggableMouseHandlers";

/**
 * Custom hook to manage all mouse event handlers for draggable items
 * Consolidates drag and resize handler creation with proper memoization
 */
export const useMouseHandlers = (config) => {
  const {
    containerRef,
    dragStartPos,
    dragOffset,
    startSize,
    position,
    setPosition,
    size,
    setSize,
    setIsDragging,
    setIsResizing,
    onPositionChange,
    item,
    timelinePosition,
  } = config;
  // Create mouse handlers using extracted functions with proper memoization
  const handleMouseMove = React.useMemo(
    () =>
      createHandleMouseMove({
        containerRef,
        dragStartPos,
        dragOffset,
        position: null, // Don't pass position to avoid circular dependencies
        setPosition, // This won't change, so it's safe
        onPositionChange, // Pass this for setting during movement
        item: item ? { id: item.id } : null, // Only pass the ID to minimize dependencies
        timelinePosition,
      }),
    [timelinePosition, item?.id], // Only depend on stable values
  );

  const handleMouseUp = React.useMemo(
    () =>
      createHandleMouseUp({
        setIsDragging,
        handleMouseMove,
        handleMouseUp: () => {
          // Create a local function that doesn't depend on position
          if (onPositionChange && item?.id) {
            // Use a snapshot of the position to prevent dependency issues
            const positionSnapshot = { ...(position || { x: 0, y: 0 }) };
            // Delay the callback to avoid update cycles
            setTimeout(() => {
              onPositionChange(item.id, positionSnapshot, true);
            }, 0);
          }
        },
        onPositionChange: null, // Don't pass this through to avoid dependency loops
        item,
        position: null, // Don't pass the position directly to avoid dependency loops
      }),
    [handleMouseMove, item?.id, setIsDragging], // Only depend on stable references
  );

  const handleMouseDown = React.useMemo(
    () =>
      createHandleMouseDown({
        dragStartPos,
        dragOffset,
        setIsDragging,
        handleMouseMove,
        handleMouseUp,
        position: null, // Pass null to avoid dependency loops
      }),
    [handleMouseMove, handleMouseUp], // Only depend on handlers
  );

  const handleResizeMouseMove = React.useMemo(
    () =>
      createHandleResizeMouseMove({
        dragStartPos,
        startSize,
        setSize,
      }),
    [],
  );

  const handleResizeMouseUp = React.useMemo(
    () =>
      createHandleResizeMouseUp({
        setIsResizing,
        handleResizeMouseMove,
        handleResizeMouseUp: () => {}, // Will be set by the function itself
      }),
    [handleResizeMouseMove],
  );

  const handleResizeMouseDown = React.useMemo(
    () =>
      createHandleResizeMouseDown({
        dragStartPos,
        startSize,
        size,
        setIsResizing,
        handleResizeMouseMove,
        handleResizeMouseUp,
      }),
    [size, handleResizeMouseMove, handleResizeMouseUp],
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeMouseDown,
    handleResizeMouseMove,
    handleResizeMouseUp,
  };
};
