import React, { useState } from 'react';
import { Button, Modal, List, ListItem, Text, Flex, Badge } from '@vibe/core';
import { useZustandStore } from '../store/useZustand';
import TimelineLogger from '../utils/logger';

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
  
  // Ensure modal starts closed when component first renders with hidden items
  React.useEffect(() => {
    // Always ensure modal is closed when hiddenCount changes (new items hidden)
    setIsModalOpen(false);
    TimelineLogger.debug('HiddenItemsManager: Modal state reset due to hiddenCount change');
  }, [hiddenCount]);
  
  TimelineLogger.debug('HiddenItemsManager render:', {
    hiddenCount,
    hiddenItemIds,
    boardItemsCount: boardItems?.length || 0,
    isModalOpen
  });
  
  // Get the actual hidden items for display
  const hiddenItems = (boardItems || []).filter(item => 
    hiddenItemIds.includes(String(item.id))
  );

  if (hiddenCount === 0) {
    return null; // Don't show anything if no items are hidden
  }

  return (
    <>
      {/* Hidden Items Button */}
      <Button
        onClick={() => {
          TimelineLogger.userAction('hiddenItemsManagerButtonClicked');
          setIsModalOpen(true);
        }}
        kind="secondary"
        size="small"
        style={{ marginLeft: '8px' }}
      >
        <Flex align="center" gap="xs">
          <Text>Unhide Items</Text>
          <Badge 
            text={hiddenCount.toString()} 
            color="negative"
            size="small"
          />
        </Flex>
      </Button>

      {/* Hidden Items Modal */}
      <Modal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Hidden Items"
        size="large"
      >
        <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {/* Compact Header with Stats and Actions */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text weight="bold" size="medium">
                  {hiddenCount} Hidden Item {hiddenCount !== 1 ? 's' : ''}
                </Text>
                <Badge 
                  text={hiddenCount.toString()} 
                  color="negative"
                  size="small"
                />
              </div>
              <Button
                onClick={() => {
                  TimelineLogger.userAction('allItemsUnhidden');
                  unhideAllItems();
                  setIsModalOpen(false);
                }}
                kind="primary"
                size="small"
              >
                Show All Items
              </Button>
            </div>

            {/* Hidden Items List */}
            <div style={{ 
              maxHeight: '350px', 
              overflowY: 'auto',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {hiddenItems.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 20px',
                    borderBottom: index < hiddenItems.length - 1 ? '1px solid #f1f3f4' : 'none',
                    transition: 'background-color 0.2s ease',
                    cursor: 'default',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: '24px' }}>
                    <Text weight="medium" size="medium" style={{ 
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '4px'
                    }}>
                      {item.name || 'Unnamed Item'}
                    </Text>
                    {item.group && (
                      <Flex align="center" gap="xs">
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: item.group.color || '#666',
                          flexShrink: 0
                        }} />
                        <Text size="small" color="secondary">
                          {item.group.title || 'Unnamed Group'}
                        </Text>
                      </Flex>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      TimelineLogger.userAction('itemUnhidden', { itemId: item.id });
                      unhideItem(item.id);
                    }}
                    kind="secondary"
                    size="small"
                    style={{ flexShrink: 0 }}
                  >
                    Show
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default HiddenItemsManager;
