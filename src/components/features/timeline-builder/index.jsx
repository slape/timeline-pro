import React, { useState, useEffect } from 'react';
import TimelineControls from './TimelineControls';
import TimelineVisualization from './TimelineVisualization';
import ItemDetailsPanel from './ItemDetailsPanel';
import './TimelineBuilder.css';

/**
 * Main TimelineBuilder component that integrates all timeline sub-components
 * Manages state and data flow between components
 */
const TimelineBuilder = ({ context }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterText, setFilterText] = useState('');

  // Fetch timeline data from monday.com when context is available
  useEffect(() => {
    if (context) {
      // TODO: Implement data fetching from monday.com using the SDK
      // For now, we'll use mock data
      const mockData = [
        {
          id: '1',
          name: 'Design Phase',
          startDate: '2025-07-01',
          endDate: '2025-07-15',
          status: 'Done',
          description: 'Complete all design work for the project',
          assignee: 'Alice Smith'
        },
        {
          id: '2',
          name: 'Development Sprint 1',
          startDate: '2025-07-16',
          endDate: '2025-07-30',
          status: 'In Progress',
          description: 'Implement core features',
          assignee: 'Bob Johnson'
        },
        {
          id: '3',
          name: 'Testing',
          startDate: '2025-07-25',
          endDate: '2025-08-05',
          status: 'Not Started',
          description: 'Test all implemented features',
          assignee: 'Charlie Brown'
        }
      ];
      
      setTimelineItems(mockData);
      setFilteredItems(mockData);
      setIsLoading(false);
    }
  }, [context]);

  // Filter items when filterText changes
  useEffect(() => {
    if (!timelineItems.length) return;
    
    const filtered = filterText
      ? timelineItems.filter(item => 
          item.name.toLowerCase().includes(filterText.toLowerCase()) ||
          item.description?.toLowerCase().includes(filterText.toLowerCase()) ||
          item.assignee?.toLowerCase().includes(filterText.toLowerCase())
        )
      : timelineItems;
    
    setFilteredItems(filtered);
  }, [filterText, timelineItems]);

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  // Handle item selection
  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  // Handle filter change
  const handleFilterChange = (value) => {
    setFilterText(value);
  };

  // Close details panel
  const handleCloseDetails = () => {
    setSelectedItem(null);
  };

  return (
    <div className="timeline-builder">
      <div className="timeline-builder__controls">
        <TimelineControls 
          onZoomIn={handleZoomIn} 
          onZoomOut={handleZoomOut} 
          onFilterChange={handleFilterChange}
        />
      </div>
      
      <div className="timeline-builder__main">
        <TimelineVisualization 
          items={filteredItems}
          isLoading={isLoading}
          zoomLevel={zoomLevel}
          onItemSelect={handleItemSelect}
        />
      </div>
      
      <div className="timeline-builder__details">
        <ItemDetailsPanel 
          selectedItem={selectedItem}
          onClose={handleCloseDetails}
        />
      </div>
    </div>
  );
};

export default TimelineBuilder;
