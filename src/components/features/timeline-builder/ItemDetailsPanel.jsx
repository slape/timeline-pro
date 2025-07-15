import React from 'react';
import { Text, IconButton, Divider } from '@vibe/core';

/**
 * Details panel component for the Timeline Builder
 * Shows detailed information about a selected timeline item
 */
const ItemDetailsPanel = ({ selectedItem, onClose }) => {
  if (!selectedItem) {
    return (
      <div className="item-details-panel item-details-panel--empty">
        <Text>Select an item on the timeline to view details</Text>
      </div>
    );
  }

  return (
    <div className="item-details-panel">
      <div className="item-details-panel__header">
        <Text type="h1" weight="bold">{selectedItem.name}</Text>
        <IconButton
          onClick={onClose}
          kind="tertiary"
          size="small"
          icon="close"
          ariaLabel="Close details"
        />
      </div>

      <Divider className="item-details-panel__divider" />      
      <div className="item-details-panel__content">
        <div className="item-details-panel__section">
          <Text weight="bold">Timeline</Text>
          <div className="item-details-panel__dates">
            <div className="item-details-panel__date">
              <Text>Start: {selectedItem.startDate}</Text>
            </div>
            <div className="item-details-panel__date">
              <Text>End: {selectedItem.endDate}</Text>
            </div>
          </div>
        </div>

        <Divider className="item-details-panel__divider" />
        <div className="item-details-panel__section">
          <Text weight="bold">Status</Text>
          <Text>{selectedItem.status}</Text>
        </div>

        <Divider className="item-details-panel__divider" />
        <div className="item-details-panel__section">
          <Text weight="bold">Description</Text>
          <Text>{selectedItem.description || 'No description available'}</Text>
        </div>

        <Divider className="item-details-panel__divider" />
        <div className="item-details-panel__section">
          <Text weight="bold">Assigned To</Text>
          <Text>{selectedItem.assignee || 'Unassigned'}</Text>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsPanel;
