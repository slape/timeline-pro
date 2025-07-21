import React, { useMemo } from 'react';
import { format } from 'date-fns';

/**
 * Component that renders scale markers (days, weeks, months, etc.) along a timeline
 * @param {Object} props - Component props
 * @param {Date} props.startDate - Start date of the timeline
 * @param {Date} props.endDate - End date of the timeline
 * @param {string} props.scale - Scale of the timeline ('days', 'weeks', 'months', 'quarters', 'years', 'none')
 * @param {string} [props.position='below'] - Position of the markers relative to the line ('above' or 'below')
 * @param {boolean} [props.flipMarkers=false] - Whether to flip markers to the opposite side of the line
 * @param {string} [props.className] - Additional CSS class names
 * @returns {JSX.Element} - ScaleMarkers component
 */
const ScaleMarkers = ({ 
  startDate, 
  endDate, 
  scale, 
  datePosition = 'below',
  className = '' 
}) => {
  // Calculate the markers based on scale and date range
  const markers = useMemo(() => {
    if (!startDate || !endDate || scale === 'none') return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const markers = [];
    
    // Reset time components to avoid timezone issues
    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);
    
    let current = new Date(start);
    let index = 1;
    
    // Add start marker (positioned at 5% to account for container padding)
    markers.push({
      date: new Date(current),
      label: getLabel(current, scale, index),
      position: 5 // 5% from left edge (matching container padding)
    });
    
    // Calculate interval based on scale
    while (current < end) {
      const next = getNextDate(current, scale);
      if (next >= end) break;
      
      // Calculate position between 5% and 95% (accounting for 5% padding on each side)
      const position = 5 + ((next - start) / (end - start)) * 90;
      markers.push({
        date: new Date(next),
        label: getLabel(next, scale, ++index),
        position: Math.min(95, Math.max(5, position)) // Keep within 5-95% range
      });
      
      current = next;
    }
    
    // Always add end marker if it's different from the last marker
    const lastMarker = markers[markers.length - 1];
    const endPosition = 95; // 5% from right edge (matching container padding)
    
    // Only add end marker if it's not the same as the last marker
    if (lastMarker.position < endPosition - 1) { // Small threshold to avoid duplicates
      markers.push({
        date: new Date(end),
        label: getLabel(end, scale, 'End'),
        position: endPosition
      });
    } else {
      // Update the last marker to be the end marker if they're close
      lastMarker.position = endPosition;
      lastMarker.label = getLabel(end, scale, 'End');
      lastMarker.date = new Date(end);
    }
    
    return markers;
  }, [startDate, endDate, scale]);
  
  // Helper function to get the next date based on scale
  function getNextDate(date, scale) {
    const next = new Date(date);
    switch (scale) {
      case 'days':
        next.setDate(next.getDate() + 1);
        break;
      case 'weeks':
        next.setDate(next.getDate() + 7);
        break;
      case 'months':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarters':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'years':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }
    return next;
  }
  
  // Helper function to format marker labels
  function getLabel(date, scale, index) {
    switch (scale) {
      case 'days':
        return format(date, 'MMM d');
      case 'weeks':
        // Calculate week number based on the start date
        if (index === 'End') {
          const start = new Date(startDate);
          const diffInWeeks = Math.ceil((date - start) / (7 * 24 * 60 * 60 * 1000));
          return `Week ${diffInWeeks}`;
        }
        return `Week ${index}`;
      case 'months':
        return format(date, 'MMM yyyy');
      case 'quarters':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      case 'years':
        return date.getFullYear().toString();
      default:
        return index.toString();
    }
  }
  
  if (!startDate || !endDate || scale === 'none' || markers.length === 0) {
    return null;
  }
  
  // Determine if markers should be flipped based on datePosition
  const shouldFlip = datePosition === 'angled below' || datePosition === 'horizontal below';
  const isAbove = shouldFlip;
  
  return (
    <div 
      className={`scale-markers ${className}`}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: isAbove ? 0 : '100%',
        height: '24px',
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      {/* Main line - positioned to match timeline */}
      <div 
        style={{
          height: '1px',
          backgroundColor: 'var(--ui-border-color)',
        }}
      />
      
      {/* Markers */}
      {markers.map((marker, index) => (
        <div
          key={`scale-marker-${index}`}
          style={{
            position: 'absolute',
            left: `${marker.position}%`,
            top: isAbove ? '100%' : 0,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: isAbove ? 'column-reverse' : 'column',
            transform: 'translateX(-50%)',
            padding: isAbove ? '0 0 4px' : '4px 0 0',
            alignItems: 'center',
          }}
        >
          <div 
            style={{
              width: '1px',
              height: '8px',
              backgroundColor: 'var(--ui-border-color)',
              flexShrink: 0,
            }}
          />
          <div 
            style={{
              fontSize: '10px',
              color: 'var(--secondary-text-color)',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              transform: scale === 'days' ? 'rotate(-25deg)' : 'none',
              transformOrigin: isAbove ? 'center top' : 'center bottom',
              order: shouldFlip ? -1 : 0,
              marginTop: isAbove ? 0 : '4px',
              marginBottom: isAbove ? '4px' : 0,
            }}
          >

            {marker.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScaleMarkers;
