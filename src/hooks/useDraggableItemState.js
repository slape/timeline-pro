import { useState, useRef } from 'react';

/**
 * Custom hook to manage draggable item state
 * Consolidates position, drag, resize, and hover state management
 */
export const useDraggableItemState = () => {
  // Position and interaction state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Refs for drag calculations
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const itemRef = useRef(null);
  const containerRef = useRef(null);

  return {
    // State
    position,
    setPosition,
    isDragging,
    setIsDragging,
    isResizing,
    setIsResizing,
    isHovered,
    setIsHovered,
    
    // Refs
    dragStartPos,
    dragOffset,
    startSize,
    itemRef,
    containerRef
  };
};
