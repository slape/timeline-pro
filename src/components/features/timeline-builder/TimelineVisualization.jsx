import React, { useMemo } from 'react';
import { Loader, EmptyState, Tooltip, Box } from '@vibe/core';

/**
 * Main visualization component for the Timeline Builder
 * Displays timeline items in a chronological format
 */
const TimelineVisualization = ({ isLoading, settings, boardItems }) => {
  if (isLoading) {
    return (
      <div className="timeline-visualization timeline-visualization--loading">
        <Loader size="large" />
      </div>
    );
  }

  // Show empty state if settings or items are not available
  if (!settings || !settings.items) {
    return (
      <div className="timeline-visualization timeline-visualization--empty">
        <EmptyState 
          title="Configure your timeline ->"
          description="Select items and colors to display on the timeline"
          visual={<img alt="No items found" height={184} src="static/media/image.58816df3.png" width={280}/>}
        />
      </div>
    );
  }

  // Generate time periods for the timeline based on selected scale
  const timePeriods = useMemo(() => {
    const scale = settings?.scale || 'weeks';
    switch (scale) {
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
  }, [settings?.scale]);

  // Create a mapping of group IDs to color positions (0=primary, 1=secondary, etc.)
  // This ensures consistent color assignment across renders
  const groupColorMap = useMemo(() => {
    const map = new Map();
    let colorIndex = 0;
    
    // Log the boardItems to inspect structure
    console.log('BoardItems:', boardItems);
    
    // If we have boardItems, create a mapping for each unique group ID
    if (boardItems && Array.isArray(boardItems)) {
      // Extract group IDs from boardItems
      // The structure may vary, so let's check for different possible structures
      const uniqueGroupIds = new Set();
      
      boardItems.forEach(item => {
        // Log the first item to see its structure
        if (uniqueGroupIds.size === 0) {
          console.log('Example board item:', item);
        }
        
        // Try different possible locations for group ID
        let groupId = null;
        
        // Option 1: item.group.id
        if (item.group && item.group.id) {
          groupId = item.group.id;
        }
        // Option 2: item.group_id
        else if (item.group_id) {
          groupId = item.group_id;
        }
        // Option 3: item.status.id or item.status
        else if (item.status) {
          groupId = typeof item.status === 'object' ? item.status.id : item.status;
        }
        
        if (groupId && !uniqueGroupIds.has(groupId)) {
          uniqueGroupIds.add(groupId);
        }
      });
      
      console.log('Unique Group IDs found:', Array.from(uniqueGroupIds));
      
      // Then assign each unique group ID to a color position
      uniqueGroupIds.forEach(groupId => {
        map.set(groupId, colorIndex % 4); // We have 4 colors
        colorIndex++;
      });
    }
    
    return map;
  }, [boardItems]); // Only recreate when boardItems change, not when colors change
  
  // Extract group ID from an item, handling different possible structures
  const getGroupId = (item) => {
    // Option 1: item.group.id
    if (item.group && item.group.id) {
      return item.group.id;
    }
    // Option 2: item.group_id
    else if (item.group_id) {
      return item.group_id;
    }
    // Option 3: item.status.id or item.status
    else if (item.status) {
      return typeof item.status === 'object' ? item.status.id : item.status;
    }
    return null;
  };
  
  // Assign colors to items based on their group ID using settings colors
  const getItemColor = (item) => {
    // Default colors if settings colors are not provided
    const defaultColors = {
      primary: '#e74c3c',    // Red
      secondary: '#3498db',  // Blue
      tertiary: '#9b59b6',   // Purple
      quaternary: '#f1c40f'  // Yellow/Gold
    };
    
    // Get colors from settings or use defaults
    const primaryColor = settings?.primaryColor || defaultColors.primary;
    const secondaryColor = settings?.secondaryColor || defaultColors.secondary;
    const tertiaryColor = settings?.tertiaryColor || defaultColors.tertiary;
    
    // Create color objects with background and light versions
    const colors = [
      { bg: primaryColor, light: adjustColorBrightness(primaryColor, 40) },
      { bg: secondaryColor, light: adjustColorBrightness(secondaryColor, 40) },
      { bg: tertiaryColor, light: adjustColorBrightness(tertiaryColor, 40) },
      { bg: defaultColors.quaternary, light: adjustColorBrightness(defaultColors.quaternary, 40) }
    ];
    
    // Get the group ID for this item
    const groupId = getGroupId(item);
    
    // Assign color based on group ID if available, using our consistent mapping
    if (groupId) {
      // Log the color assignment for debugging
      if (!window.loggedColorAssignments) {
        window.loggedColorAssignments = new Set();
      }
      
      if (!window.loggedColorAssignments.has(groupId)) {
        console.log(`Assigning color for group ID: ${groupId}`);
        window.loggedColorAssignments.add(groupId);
      }
      
      // Look up the color position for this group ID
      if (groupColorMap.has(groupId)) {
        const colorPosition = groupColorMap.get(groupId);
        return colors[colorPosition];
      }
    }
    
    // Fallback to primary color if no group ID is available or not in map
    return colors[0];
  };
  
  // Helper function to adjust color brightness for light versions
  const adjustColorBrightness = (hex, percent) => {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Increase brightness
    r = Math.min(255, r + Math.floor(percent / 100 * (255 - r)));
    g = Math.min(255, g + Math.floor(percent / 100 * (255 - g)));
    b = Math.min(255, b + Math.floor(percent / 100 * (255 - b)));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Distribute items across time periods based on settings
  // We need to make sure this function is called whenever settings colors change
  const distributeItems = () => {
    const periodItems = {};
    
    // Initialize empty arrays for each time period
    timePeriods.forEach(period => {
      periodItems[period.id] = [];
    });
    
    // Create a map of item IDs to their corresponding group IDs for quick lookup
    const itemToGroupMap = new Map();
    
    // If we have boardItems, create a mapping of item IDs to group IDs
    if (boardItems && Array.isArray(boardItems)) {
      boardItems.forEach(boardItem => {
        const groupId = getGroupId(boardItem);
        if (groupId) {
          itemToGroupMap.set(boardItem.id, groupId);
        }
      });
    }
    
    console.log('Item to Group Map:', Array.from(itemToGroupMap.entries()));
    
    // If we have items in settings, distribute them
    if (settings?.items && Array.isArray(settings.items)) {
      settings.items.forEach((item, index) => {
        // For demo purposes, distribute items evenly
        // In a real app, you would use the item's date to determine placement
        const periodIndex = index % timePeriods.length;
        const periodId = timePeriods[periodIndex].id;
        
        // Get the group ID for this item, either from the item itself or our mapping
        let groupId = getGroupId(item);
        
        // If we couldn't get a group ID from the item directly, try the mapping
        if (!groupId && itemToGroupMap.has(item.id)) {
          groupId = itemToGroupMap.get(item.id);
        }
        
        // Create a new item with the correct color
        const newItem = {
          ...item,
          // If we have a group ID, make sure it's properly set for getItemColor
          group: groupId ? { ...item.group, id: groupId } : item.group
        };
        
        // Get the color for this item based on its group
        const color = getItemColor(newItem);
        
        // Add the item to the period with its color
        periodItems[periodId].push({
          ...newItem,
          color: color
        });
      });
    }
    
    return periodItems;
  };
  
  // Create a dependency array of the settings colors to force re-distribution when colors change
  const colorDependencies = useMemo(() => {
    return [
      settings?.primaryColor,
      settings?.secondaryColor,
      settings?.tertiaryColor
    ];
  }, [settings?.primaryColor, settings?.secondaryColor, settings?.tertiaryColor]);
  
  // Re-distribute items when settings colors change to ensure items get the new colors
  const distributedItems = useMemo(() => distributeItems(), [settings?.items, timePeriods, colorDependencies]);

  return (
    <Box
      rounded="medium"
      marginY='small'
      marginX='xs'
    >
      <div className="timeline-visualization" style={{ 
        backgroundColor: settings?.backgroundColor || '#2d2d2d', 
        color: (settings?.backgroundColor === '#ffffff' || settings?.backgroundColor === '#f5f5f5') ? '#333333' : 'white',
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
          {settings?.title || 'Timeline'}
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
                <Tooltip content={item.name} key={`item-${item.id}`}>
                  <div 
                    style={{
                      backgroundColor: item.color?.bg || settings?.primaryColor || '#e74c3c',
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
                    title={`Group: ${item.group?.title || 'Ungrouped'}`}
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
            {settings?.items && settings.items.length > 0 && (() => {
              // Get unique groups from items
              const groups = [];
              const groupIds = new Set();
              
              // Use boardItems to get consistent group IDs
              if (boardItems && Array.isArray(boardItems)) {
                boardItems.forEach(item => {
                  const groupId = getGroupId(item);
                  if (groupId && !groupIds.has(groupId)) {
                    groupIds.add(groupId);
                    
                    // Get group title if available
                    let groupTitle = `Group ${groupId}`;
                    if (item.group && item.group.title) {
                      groupTitle = item.group.title;
                    } else if (item.status && typeof item.status === 'object' && item.status.text) {
                      groupTitle = item.status.text;
                    } else if (item.status && typeof item.status === 'string') {
                      groupTitle = item.status;
                    }
                    
                    groups.push({
                      id: groupId,
                      title: groupTitle,
                      color: getItemColor(item)
                    });
                  }
                });
              }
              
              // If no groups found, use default colors
              if (groups.length === 0) {
                const defaultColors = [
                  { bg: settings?.primaryColor || '#e74c3c', light: adjustColorBrightness(settings?.primaryColor || '#e74c3c', 40) },
                  { bg: settings?.secondaryColor || '#3498db', light: adjustColorBrightness(settings?.secondaryColor || '#3498db', 40) },
                  { bg: settings?.tertiaryColor || '#9b59b6', light: adjustColorBrightness(settings?.tertiaryColor || '#9b59b6', 40) }
                ];
                
                return defaultColors.map((color, index) => (
                  <div key={`legend-default-${index}`} style={{ 
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
                    <span>Group {index + 1}</span>
                  </div>
                ));
              }
              
              // Return legend items for each group
              return groups.map(group => (
                <div key={`legend-${group.id}`} style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <div style={{ 
                    width: '15px', 
                    height: '15px', 
                    backgroundColor: group.color.bg,
                    borderRadius: '3px'
                  }}></div>
                  <span>{group.title}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </Box>
  );
};

export default TimelineVisualization;
