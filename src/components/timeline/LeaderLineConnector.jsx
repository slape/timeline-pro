import React, { useEffect, useState } from 'react';

const LeaderLineConnector = ({ fromId, toId }) => {
  const [lineCoords, setLineCoords] = useState(null);

  const updateLinePosition = () => {
    const fromElem = document.getElementById(fromId); // Board item container
    const toElem = document.getElementById(toId); // Timeline marker

    if (fromElem && toElem) {
      // Get the timeline container to calculate relative positions
      const timelineContainer = fromElem.closest('.timeline-container');
      if (!timelineContainer) return;
      
      const containerRect = timelineContainer.getBoundingClientRect();
      
      // Debug: Log the element structure to understand Rnd wrapping
      if (Math.random() < 0.01) { // Only log occasionally to avoid spam
        console.log('FromElem structure:', {
          id: fromElem.id,
          className: fromElem.className,
          children: Array.from(fromElem.children).map(child => ({
            tagName: child.tagName,
            className: child.className,
            style: child.style.cssText
          }))
        });
      }
      
      // For Rnd components, we should use the container element directly
      // since Rnd manages the positioning through transforms
      let actualItemElement = fromElem;
      
      // Look for the Rnd wrapper or the Box component inside
      const rndWrapper = fromElem.querySelector('div[style*="transform"]');
      const boxElement = fromElem.querySelector('div[style*="background-color"]');
      
      if (rndWrapper) {
        actualItemElement = rndWrapper;
      } else if (boxElement) {
        actualItemElement = boxElement;
      }
      const fromRect = actualItemElement.getBoundingClientRect();
      const toRect = toElem.getBoundingClientRect();
      
      // Calculate timeline marker X position (center horizontally)
      const markerX = toRect.left + toRect.width / 2 - containerRect.left;
      
      // Find the actual timeline line position within the container
      const timelineLineElement = timelineContainer.querySelector('div[style*="height: 2px"]');
      let timelineY;
      
      if (timelineLineElement) {
        const timelineRect = timelineLineElement.getBoundingClientRect();
        timelineY = timelineRect.top + timelineRect.height / 2 - containerRect.top;
      } else {
        // Fallback: calculate timeline position based on container
        const containerHeight = containerRect.height;
        // Assume timeline is at 50% for now (this matches the Timeline component logic)
        timelineY = containerHeight * 0.5;
      }
      
      // The connection point should be at the timeline intersection
      const toX = markerX;
      const toY = timelineY;
      
      // Calculate board item position relative to timeline
      const itemCenterX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const itemCenterY = fromRect.top + fromRect.height / 2 - containerRect.top;
      
      // Determine if item is above or below the timeline marker
      const isItemBelow = itemCenterY > toY;
      
      // Calculate attachment point on the board item
      // If item is below timeline, attach to top edge; if above, attach to bottom edge
      const fromX = itemCenterX; // Center horizontally on the item
      const fromY = isItemBelow 
        ? fromRect.top - containerRect.top // Top edge of item
        : fromRect.bottom - containerRect.top; // Bottom edge of item
      
      // The line connects from the item edge to the FIXED timeline marker position
      // This allows the line to be perpendicular when directly below/above, 
      // or diagonal when the item is moved horizontally
      setLineCoords({ 
        fromX, 
        fromY, 
        toX, // Use the actual timeline marker X position (FIXED)
        toY  // Use the actual timeline marker Y position (FIXED)
      });
    }
  };

  useEffect(() => {
    // Initial position calculation with multiple attempts
    const timer1 = setTimeout(updateLinePosition, 50);
    const timer2 = setTimeout(updateLinePosition, 200);
    const timer3 = setTimeout(updateLinePosition, 500);
    
    // Update on resize
    window.addEventListener('resize', updateLinePosition);
    
    // Update very frequently for drag operations (higher frequency to catch Rnd updates)
    const interval = setInterval(updateLinePosition, 8); // ~120fps for better tracking

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearInterval(interval);
      window.removeEventListener('resize', updateLinePosition);
    };
  }, [fromId, toId]);

  if (!lineCoords) return null;

  // Calculate line properties
  const length = Math.sqrt(
    Math.pow(lineCoords.toX - lineCoords.fromX, 2) + 
    Math.pow(lineCoords.toY - lineCoords.fromY, 2)
  );
  const angle = Math.atan2(
    lineCoords.toY - lineCoords.fromY, 
    lineCoords.toX - lineCoords.fromX
  ) * 180 / Math.PI;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5, // Below items but above timeline
      }}
    >
      <line
        x1={lineCoords.fromX}
        y1={lineCoords.fromY}
        x2={lineCoords.toX}
        y2={lineCoords.toY}
        stroke="#666"
        strokeWidth="2"
        opacity="0.7"
      />
      {/* Small dot at the timeline endpoint */}
      <circle
        cx={lineCoords.toX}
        cy={lineCoords.toY}
        r="4"
        fill="#666"
        opacity="0.8"
      />
    </svg>
  );
};

export default LeaderLineConnector;
