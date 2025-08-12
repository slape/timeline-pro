import React from 'react';
import getMarkerStyles from '../../functions/getMarkerStyles';

/**
 * TimelineMarkers component renders date markers along the timeline
 * 
 * @param {Array} markers - Array of marker objects with position and label
 * @param {string} datePosition - Position of date labels ('above', 'below', 'none')
 * @param {string} timelineTop - CSS top position for the timeline
 * @returns {JSX.Element} Timeline markers
 */
const TimelineMarkers = ({ markers, datePosition, timelineTop }) => {
  const markerStyles = getMarkerStyles(datePosition);

  return (
    <>
      {markers.map((marker, index) => {
        const isEdgeMarker = index === 0 || index === markers.length - 1;
        const isAbove = datePosition.includes('above');
        
        // For 'none' date position, only show the marker and label for first and last markers
        const showMarker = datePosition !== 'none' || isEdgeMarker;
        
        // Always render a hidden anchor point for connector lines
        if (!showMarker) {
          return (
            <div
              key={`marker-${index}`}
              id={`timeline-marker-${index}`}
              style={{
                position: 'absolute',
                left: `${marker.position}%`,
                top: timelineTop,
                width: '1px',
                height: '1px',
                pointerEvents: 'none',
                opacity: 0,
                zIndex: 2
              }}
            />
          );
        }
        
        return (
          <div
            key={`marker-${index}`}
            id={`timeline-marker-${index}`}
            style={{
              position: 'absolute',
              left: `${marker.position}%`,
              top: timelineTop,
              transform: isAbove ? 'translateX(-50%) translateY(-100%)' : 'translateX(-50%)',
              display: 'flex',
              ...markerStyles.markerContainer,
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            <div style={markerStyles.markerLine} />
            <div style={markerStyles.dateLabel}>
              {marker.label}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default TimelineMarkers;
