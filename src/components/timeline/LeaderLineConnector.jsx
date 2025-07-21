import React, { useEffect, useState } from 'react';

const LeaderLineConnector = ({ fromId, toId }) => {
  const [lineCoords, setLineCoords] = useState(null);

  const updateLinePosition = () => {
    const fromElem = document.getElementById(fromId);
    const toElem = document.getElementById(toId);

    if (fromElem && toElem) {
      const fromRect = fromElem.getBoundingClientRect();
      const toRect = toElem.getBoundingClientRect();
      
      // Get the timeline container to calculate relative positions
      const timelineContainer = fromElem.closest('.timeline-container');
      const containerRect = timelineContainer ? timelineContainer.getBoundingClientRect() : { left: 0, top: 0 };
      
      // Calculate connection points
      const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
      const toX = toRect.left + toRect.width / 2 - containerRect.left;
      const toY = toRect.top + toRect.height / 2 - containerRect.top;
      
      setLineCoords({ fromX, fromY, toX, toY });
    }
  };

  useEffect(() => {
    // Initial position calculation
    const timer = setTimeout(updateLinePosition, 100); // Small delay to ensure elements are rendered
    
    // Update on resize
    window.addEventListener('resize', updateLinePosition);
    
    // Update frequently for drag operations
    const interval = setInterval(updateLinePosition, 16); // ~60fps

    return () => {
      clearTimeout(timer);
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
      <defs>
        <marker
          id={`arrowhead-${fromId}-${toId}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#666"
          />
        </marker>
      </defs>
      <line
        x1={lineCoords.fromX}
        y1={lineCoords.fromY}
        x2={lineCoords.toX}
        y2={lineCoords.toY}
        stroke="#666"
        strokeWidth="2"
        strokeDasharray="5,5"
        markerEnd={`url(#arrowhead-${fromId}-${toId})`}
        opacity="0.7"
      />
    </svg>
  );
};

export default LeaderLineConnector;
