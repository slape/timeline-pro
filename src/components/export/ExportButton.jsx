import React, { useState, useContext, useRef } from 'react';
import { Button, Modal, Box, Checkbox, Flex, Text, Heading } from "@vibe/core";
import { toPng } from 'html-to-image';
import { ThemeProvider } from '@vibe/core';

/**
 * ExportButton component displays a button that opens a modal for export configuration
 * Current options: including/excluding background
 * 
 * @param {Object} props Component props
 * @param {string} props.theme Current theme ('light' or 'dark')
 * @returns {JSX.Element} Export button component
 */
const ExportButton = ({ theme }) => {
  // State to manage modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State to track background inclusion in export
  const [includeBackground, setIncludeBackground] = useState(false);

  // State to track export status
  const [isExporting, setIsExporting] = useState(false);
  
  // Reference to access the theme context
  const themeContextRef = useRef();
  
  // Handler for modal open/close
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };
  
  // Handler for checkbox change
  const handleBackgroundToggle = () => {
    setIncludeBackground(!includeBackground);
  };
  
  // Export the TimelineBoard as a PNG
  const handleExport = () => {
    setIsExporting(true);
    // console.log('Export initiated');
    
    try {
      // Get all elements with the timeline-board class
      const timelineBoardElements = document.querySelectorAll('.timeline-board');
      // console.log('Timeline board elements found:', timelineBoardElements.length);
      
      // Get the TimelineBoard element
      const timelineBoardElement = timelineBoardElements[0];
      
      if (!timelineBoardElement) {
        console.error('Timeline board element not found');
        setIsExporting(false);
        toggleModal();
        return;
      }
      
      // console.log('Timeline board dimensions:', {
      //   offsetWidth: timelineBoardElement.offsetWidth,
      //   offsetHeight: timelineBoardElement.offsetHeight,
      //   scrollWidth: timelineBoardElement.scrollWidth,
      //   scrollHeight: timelineBoardElement.scrollHeight
      // });
      
      // Use the theme prop passed from App.jsx
      const currentTheme = theme || 'light';
      // console.log('Using theme for background:', currentTheme);
      
      // Set background color based on theme if includeBackground is true
      const backgroundColor = includeBackground 
        ? (currentTheme === 'dark' ? '#1c1f3b' : '#ffffff') // Dark mode uses dark blue, light mode uses white
        : 'transparent';
      
      // Options for the image export
      const options = {
        backgroundColor: backgroundColor,
        style: {
          // Ensure we capture all content
          width: `${timelineBoardElement.scrollWidth}px`,
          height: `${timelineBoardElement.scrollHeight}px`
        },
        pixelRatio: 2, // Higher quality
        skipAutoScale: true // Don't scale the DOM
      };
      
      // console.log('Starting PNG conversion with options:', options);
      
      // Convert the element to PNG
      toPng(timelineBoardElement, options)
        .then(dataUrl => {
          // console.log('PNG conversion successful, data URL length:', dataUrl.length);
          
          // Create a download link
          const link = document.createElement('a');
          link.download = 'timeline-export.png';
          link.href = dataUrl;
          document.body.appendChild(link); // Add link to document to ensure it triggers in all browsers
          // console.log('Download link created and appended to body');
          
          // Trigger click event
          link.click();
          // console.log('Click triggered on download link');
          
          // Clean up - remove the link
          setTimeout(() => {
            document.body.removeChild(link);
            // console.log('Download link removed');
            setIsExporting(false);
            toggleModal();
          }, 100);
        })
        .catch(error => {
          console.error('Error exporting timeline:', error);
          setIsExporting(false);
          toggleModal();
        });
    } catch (error) {
      console.error('Error during export:', error);
      setIsExporting(false);
      toggleModal();
    }
  };
  
  return (
    <>
      {/* Left-justified export button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '16px 0' }}>
        <Button size="small" kind="primary" onClick={toggleModal}>
          Export Timeline
        </Button>
      </div>
      
      {/* Export configuration modal */}
      <Modal
        id="export-modal" 
        title="Export Timeline"
        show={isModalOpen}
        onClose={toggleModal}
        width="400px"
      >
        <Box padding="medium">
          <Flex direction="column" gap={16} align="start">
            <Heading type="h4" weight="bold">
              Export Options
            </Heading>
            
            <Text type="secondary">
              Configure how you want to export your timeline.
            </Text>
            
            <Checkbox
              label="Include background"
              checked={includeBackground}
              onChange={handleBackgroundToggle}
            />
            
            <Flex justify="end" style={{ width: '100%', marginTop: '16px' }} gap={8}>
              <Button kind="tertiary" onClick={toggleModal}>
                Cancel
              </Button>
              <Button onClick={handleExport} isLoading={isExporting}>
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Modal>
    </>
  );
};

export default ExportButton;
