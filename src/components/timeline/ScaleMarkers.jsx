import React, { useMemo } from 'react';
import { format } from 'date-fns';

/**
 * Component that renders scale markers (days, weeks, months, etc.) along a timeline
 * @param {Object} props - Component props
 * @param {Date} props.startDate - Start date of the timeline
 * @param {Date} props.endDate - End date of the timeline
 * @param {string} props.scale - Scale of the timeline ('days', 'weeks', 'months', 'quarters', 'years', 'none')
 * @param {string} [props.position='below'] - Position of the markers relative to the line ('above' or 'below')
 * @param {string} [props.className] - Additional CSS class names
 * @returns {JSX.Element} - ScaleMarkers component
 */
const ScaleMarkers = ({ 
  startDate, 
  endDate, 
  scale, 
  position = 'below',
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
    
    // Add start marker
    markers.push({
      date: new Date(current),
      label: getLabel(current, scale, index),
      position: 0
    });
    
    // Calculate interval based on scale
    while (current < end) {
      const next = getNextDate(current, scale);
      if (next >= end) break;
      
      const position = ((next - start) / (end - start)) * 100;
      markers.push({
        date: new Date(next),
        label: getLabel(next, scale, ++index),
        position: Math.min(100, Math.max(0, position))
      });
      
      current = next;
    }
    
    // Add end marker if there's enough space
    if (markers.length > 1) {
      const lastMarker = markers[markers.length - 1];
      if (lastMarker.position < 95) { // Only add if not too close to the end
        markers.push({
          date: new Date(end),
          label: getLabel(end, scale, 'End'),
          position: 100
        });
      }
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
  
  const isAbove = position === 'above';
  
  return (
    <div 
      className={`scale-markers ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '40px',
        margin: '20px 0',
      }}
    >
      {/* Main line */}
      <div 
        style={{
          position: 'absolute',
          top: isAbove ? '100%' : 0,
          left: 0,
          width: '100%',
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
            alignItems: 'center',
          }}
        >
          <div 
            style={{
              width: '1px',
              height: '8px',
              backgroundColor: 'var(--ui-border-color)',
              marginBottom: isAbove ? 0 : '4px',
              marginTop: isAbove ? '4px' : 0,
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
