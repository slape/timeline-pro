import React from 'react';
import { Flex, Text, Box } from '@vibe/core';
import { useZustandStore } from '../../store/useZustand';

/**
 * GroupLegend component that displays a legend of unique group names and their colors
 * 
 * @returns {JSX.Element} - Group legend component
 */
const GroupLegend = () => {
  const { boardItems, hiddenItemIds } = useZustandStore();
  // Get unique groups from visible boardItems
  const uniqueGroups = React.useMemo(() => {
    const groupsMap = new Map();
    
    // Filter out hidden items first
    const visibleItems = boardItems.filter(item => !hiddenItemIds.has(item.id));
    
    // Only process visible items
    visibleItems.forEach(item => {
      if (item.group && item.group.id) {
        const groupColor = item.group.color || '#CCCCCC';
        
        if (!groupsMap.has(item.group.id)) {
          groupsMap.set(item.group.id, {
            id: item.group.id,
            name: item.group.title || 'Unnamed Group',
            color: groupColor
          });
        }
      }
    });
    
    const groups = Array.from(groupsMap.values());
    return groups;
  }, [boardItems, hiddenItemIds]); // Add hiddenItemIds as dependency

  if (uniqueGroups.length === 0) {
    return null; // Don't render if no groups
  }

  return (
    <Box 
      padding="medium"
      style={{
        borderTop: '1px solid var(--ui-border-color)',
        backgroundColor: 'var(--ui-bg-color)'
      }}
    >
      <Flex wrap gap="small" justify="center">
        {uniqueGroups.map(group => (
          <Flex key={group.id} align="center" gap="xsmall" marginRight="medium">
            <div 
              style={{
                width: '16px',
                height: '16px',
                minWidth: '16px',
                minHeight: '16px',
                backgroundColor: group.color || '#CCCCCC',
                borderRadius: '4px',
                border: '1px solid rgba(0,0,0,0.2)',
                display: 'inline-block',
                marginRight: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            />
            <Text type={Text.types.TEXT2}>
              {group.name}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default GroupLegend;
