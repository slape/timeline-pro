import React, { useState } from 'react';
import { Button, Modal, List, ListItem, Text, Flex, Badge } from '@vibe/core';
import { useZustandStore } from '../store/useZustand';
import { useVisibleItems } from '../hooks/useVisibleItems';

/**
 * HiddenItemsManager component for showing/hiding timeline items
 * Displays a button with count of hidden items and modal to manage them
 */
const HiddenItemsManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { 
    boardItems, 
    hiddenItemIds, 
    unhideItem, 
    unhideAllItems, 
    getHiddenItemCount 
  } = useZustandStore();
  
  const hiddenCount = getHiddenItemCount();
  
  // Get the actual hidden items for display
  const hiddenItems = (boardItems || []).filter(item => 
    hiddenItemIds.includes(item.id)
  );

  if (hiddenCount === 0) {
    return null; // Don't show anything if no items are hidden
  }

  return (
    <>
      {/* Hidden Items Button */}
      <Button
        onClick={() => setIsModalOpen(true)}
        kind="secondary"
        size="small"
        style={{ marginLeft: '8px' }}
      >
        <Flex align="center" gap="xs">
          <Text>Hidden Items</Text>
          <Badge 
            text={hiddenCount.toString()} 
            color="negative"
            size="small"
          />
        </Flex>
      </Button>

      {/* Hidden Items Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Hidden Timeline Items"
        size="medium"
      >
        <div style={{ padding: '16px' }}>
          <Flex direction="column" gap="md">
            <Text>
              The following items are currently hidden from the timeline. 
              Click "Show" to make them visible again.
            </Text>
            
            {/* Show All Button */}
            <Flex justify="space-between" align="center">
              <Text weight="bold">
                {hiddenCount} item{hiddenCount !== 1 ? 's' : ''} hidden
              </Text>
              <Button
                onClick={() => {
                  unhideAllItems();
                  setIsModalOpen(false);
                }}
                kind="primary"
                size="small"
              >
                Show All Items
              </Button>
            </Flex>

            {/* Hidden Items List */}
            <List>
              {hiddenItems.map(item => (
                <ListItem
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: '1px solid #e1e1e1'
                  }}
                >
                  <Flex direction="column" gap="xs" style={{ flex: 1 }}>
                    <Text weight="medium">{item.name || 'Unnamed Item'}</Text>
                    {item.group && (
                      <Text size="small" color="secondary">
                        Group: {item.group.title || 'Unnamed Group'}
                      </Text>
                    )}
                  </Flex>
                  <Button
                    onClick={() => unhideItem(item.id)}
                    kind="secondary"
                    size="xs"
                  >
                    Show
                  </Button>
                </ListItem>
              ))}
            </List>
          </Flex>
        </div>
      </Modal>
    </>
  );
};

export default HiddenItemsManager;
