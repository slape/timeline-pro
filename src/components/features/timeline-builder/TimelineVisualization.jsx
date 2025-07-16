import React, { useMemo } from 'react';
import { Loader, EmptyState, Tooltip } from '@vibe/core';

/**
 * Main visualization component for the Timeline Builder
 * Displays timeline items in a chronological format
 */
const TimelineVisualization = ({ items, isLoading, zoomLevel, onItemSelect, backgroundColor = '#2d2d2d', timeScale = 'quarters' }) => {
  if (isLoading) {
    return (
      <div className="timeline-visualization timeline-visualization--loading">
        <Loader size="large" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="timeline-visualization timeline-visualization--empty">
        <EmptyState 
          title="No timeline items to display"
          description="Add items to your board to see them on the timeline"
          visual="timeline"
        />
      </div>
    );
  }

  // Generate time periods for the timeline based on selected scale
  const timePeriods = useMemo(() => {
    switch (timeScale) {
      case 'days':
        return Array.from({ length: 7 }, (_, i) => {
          const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
          return { id: `day-${i}`, label: day, subLabels: [`Day ${i+1}`] };
        });
      case 'weeks':
        return Array.from({ length: 4 }, (_, i) => {
          return { id: `week-${i}`, label: `Week ${i+1}`, subLabels: [`Days ${i*7+1}-${(i+1)*7}`] };
        });
      case 'months':
        return Array.from({ length: 12 }, (_, i) => {
          const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];
          return { id: `month-${i}`, label: month, subLabels: [] };
        });
      case 'quarters':
        return [
          { id: 'Q1', label: 'Q1', subLabels: ['Jan', 'Feb', 'Mar'] },
          { id: 'Q2', label: 'Q2', subLabels: ['Apr', 'May', 'Jun'] },
          { id: 'Q3', label: 'Q3', subLabels: ['Jul', 'Aug', 'Sep'] },
          { id: 'Q4', label: 'Q4', subLabels: ['Oct', 'Nov', 'Dec'] }
        ];
      case 'years':
        return Array.from({ length: 5 }, (_, i) => {
          const year = new Date().getFullYear() + i - 2;
          return { id: `year-${year}`, label: `${year}`, subLabels: [] };
        });
      default:
        return [
          { id: 'Q1', label: 'Q1', subLabels: ['Jan', 'Feb', 'Mar'] },
          { id: 'Q2', label: 'Q2', subLabels: ['Apr', 'May', 'Jun'] },
          { id: 'Q3', label: 'Q3', subLabels: ['Jul', 'Aug', 'Sep'] },
          { id: 'Q4', label: 'Q4', subLabels: ['Oct', 'Nov', 'Dec'] }
        ];
    }
  }, [timeScale]);

  // Assign colors to items based on their position (for demo purposes)
  const getItemColor = (index) => {
    const colors = [
      { bg: '#e74c3c', light: '#f5b7b1' }, // Red
      { bg: '#3498db', light: '#aed6f1' }, // Blue
      { bg: '#9b59b6', light: '#d6c1e0' }, // Purple
      { bg: '#f1c40f', light: '#f9e79f' }  // Yellow/Gold
    ];
    return colors[index % colors.length];
  };

  // Distribute items across time periods (simplified for demo)
  const distributeItems = () => {
    const periodItems = {};
    
    // Initialize empty arrays for each time period
    timePeriods.forEach(period => {
      periodItems[period.id] = [];
    });
    
    items.forEach((item, index) => {
      // For demo purposes, distribute items evenly
      // In a real app, you would use the item's date to determine placement
      const periodIndex = index % timePeriods.length;
      const periodId = timePeriods[periodIndex].id;
      periodItems[periodId].push({
        ...item,
        color: getItemColor(index)
      });
    });
    
    return periodItems;
  };
  
  const distributedItems = useMemo(() => distributeItems(), [items, timePeriods]);

  return (
    <div className="timeline-visualization" style={{ 
      backgroundColor: backgroundColor, 
      color: backgroundColor === '#ffffff' || backgroundColor === '#f5f5f5' ? '#333333' : 'white',
      padding: '20px',
      borderRadius: '8px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        margin: '0 0 40px 0',
        fontSize: '24px',
        fontWeight: '500'
      }}>
        Event Timeline ({timeScale.charAt(0).toUpperCase() + timeScale.slice(1)})
      </h2>
      
      {/* Timeline visualization */}
      <div style={{ position: 'relative', flex: 1 }}>
        {/* Time period labels */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '80px',
          position: 'relative'
        }}>
          {timePeriods.map((period, index) => (
            <div key={period.id} style={{ 
              textAlign: 'center', 
              width: `${100 / timePeriods.length}%`,
              position: 'relative'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{period.label}</div>
              {period.subLabels && period.subLabels.length > 0 && (
                <div style={{ fontSize: '14px', color: '#aaa' }}>
                  {period.subLabels.join(' ')}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Timeline line with dots */}
        <div style={{ 
          position: 'relative',
          height: '2px',
          backgroundColor: '#555',
          margin: '0 5% 60px 5%',
          width: '90%'
        }}>
          {timePeriods.map((period, index) => {
            const position = index / (timePeriods.length - 1) * 100;
            return (
              <div key={`dot-${period.id}`} style={{
                position: 'absolute',
                left: `${position}%`,
                top: '-4px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                border: '2px solid #555'
              }} />
            );
          })}
        </div>
        
        {/* Timeline items */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          position: 'relative',
          padding: '0 5%'
        }}>
          {timePeriods.map((period, pIndex) => (
            <div key={`items-${period.id}`} style={{ 
              width: `${100 / timePeriods.length}%`, 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              {distributedItems[period.id]?.map((item, iIndex) => (
                <Tooltip content={item.name} key={item.id}>
                  <div 
                    onClick={() => onItemSelect(item)}
                    style={{
                      backgroundColor: item.color.bg,
                      color: 'white',
                      padding: '10px 15px',
                      borderRadius: '6px',
                      margin: '5px 0',
                      cursor: 'pointer',
                      width: '80%',
                      textAlign: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      position: 'relative',
                      transform: iIndex % 2 === 0 ? 'translateY(-40px)' : 'translateY(0)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      zIndex: 2
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
                      e.currentTarget.style.transform = iIndex % 2 === 0 ? 'translateY(-42px)' : 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                      e.currentTarget.style.transform = iIndex % 2 === 0 ? 'translateY(-40px)' : 'translateY(0)';
                    }}
                  >
                    {item.name}
                  </div>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '60px',
          gap: '20px'
        }}>
          {[0, 1, 2, 3].map(index => {
            const color = getItemColor(index);
            return (
              <div key={`legend-${index}`} style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '5px'
              }}>
                <div style={{ 
                  width: '15px', 
                  height: '15px', 
                  backgroundColor: color.bg,
                  borderRadius: '3px'
                }}></div>
                <span style={{ fontSize: '14px' }}>
                  {index === 0 ? 'Project Start' : 
                   index === 1 ? 'Milestone' : 
                   index === 2 ? 'Review' : 'Completion'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineVisualization;
