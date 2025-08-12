import React from 'react';

/**
 * TimelineScaleMarkers component renders scale markers (weeks, days, etc.) along the timeline
 * This matches the implementation currently in Timeline.jsx
 * 
 * @param {string} scale - Scale type ('weeks', 'days', 'none')
 * @param {Array} scaleMarkers - Array of scale marker objects with position and label
 * @param {string} timelineTop - CSS top position for the timeline
 * @param {boolean} shouldFlipScaleMarkers - Whether to flip markers below the timeline
 * @returns {JSX.Element} Scale markers
 */
const TimelineScaleMarkers = ({ scale, scaleMarkers, timelineTop, shouldFlipScaleMarkers }) => {
  // Don't render if scale is 'none' or no markers
  if (scale === 'none' || !scaleMarkers?.length) {
    return null;
  }

  return (
    <>
      {/* Scale marker line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: '100%',
          top: timelineTop, // Use the same top position as the timeline
          height: '1px',
          backgroundColor: 'var(--ui-border-color)',
          zIndex: 1,
        }}
      />
      
      {/* Scale marker ticks and labels */}
      {scaleMarkers.map((marker, index) => {
        // Skip rendering hidden markers (like the second-to-last marker if it matches the last one)
        if (marker.hidden) return null;
        
        const isAbove = !shouldFlipScaleMarkers;
        const offset = shouldFlipScaleMarkers ? 3 : -28; // -1px when flipped (below), -23px when not flipped (above)
        
        return (
          <div
            key={`scale-marker-${index}`}
            style={{
              position: 'absolute',
              left: `${marker.position}%`,
              top: `calc(${timelineTop} + ${offset}px)`, // Offset from timeline position
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: isAbove ? 'column-reverse' : 'column', // column-reverse for above, column for below
              alignItems: 'center',
              zIndex: 2,
            }}
          >
            <div 
              style={{
                width: '1px',
                height: '8px',
                backgroundColor: 'var(--ui-border-color)',
                flexShrink: 0,
                marginTop: isAbove ? 0 : 0, // No margin needed when using proper offsets
                marginBottom: isAbove ? '-1px' : 0, // Connect to timeline when above
              }}
            />
            <div 
              style={{
                fontSize: '10px',
                color: 'var(--secondary-text-color)',
                whiteSpace: 'nowrap',
                marginTop: isAbove ? '0px' : '8px', // Add space below the tick when markers are below
                marginBottom: isAbove ? '8px' : '0px', // Add space above the tick when markers are above
                textAlign: 'center',
                transform: scale === 'days' ? 'rotate(-25deg)' : 'none',
                transformOrigin: isAbove ? 'center bottom' : 'center top',
              }}
            >
              {marker.label}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default TimelineScaleMarkers;
