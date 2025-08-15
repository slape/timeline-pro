import React, { useState } from "react";
import { Button, Modal, Box, Checkbox, Flex, Text, Heading } from "@vibe/core";
import { toPng } from "html-to-image";
import { useZustandStore } from "../../store/useZustand";

/**
 * ExportButton component displays a button that opens a modal for export configuration
 * Current options: including/excluding background
 *
 * @returns {JSX.Element} Export button component
 */
const ExportButton = () => {
  const { context } = useZustandStore();
  const theme = context.theme;
  // State to manage modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State to track background inclusion in export
  const [includeBackground, setIncludeBackground] = useState(false);

  // State to track export status
  const [isExporting, setIsExporting] = useState(false);

  // Handler for modal open/close
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Handler for checkbox change
  const handleBackgroundToggle = () => {
    setIncludeBackground(!includeBackground);
  };

  // Export the TimelineBoard as a PNG
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Get the timeline board element
      const timelineBoardElement = document.querySelector(".timeline-board");
      if (!timelineBoardElement) {
        console.error("Timeline board element not found");
        setIsExporting(false);
        toggleModal();
        return;
      }

      // Temporarily make the original element visible and get its dimensions
      const originalDisplay = timelineBoardElement.style.display;
      const originalPosition = timelineBoardElement.style.position;
      timelineBoardElement.style.display = "block";
      timelineBoardElement.style.position = "relative";

      // Get the full width and height of the content
      const fullWidth = timelineBoardElement.scrollWidth;
      const fullHeight = timelineBoardElement.scrollHeight;
      const padding = 32; // Add some padding around the content

      // Calculate container dimensions with extra padding
      const containerWidth = fullWidth + padding * 2;
      const containerHeight = fullHeight + padding * 2;

      // Create a container for the export
      const exportContainer = document.createElement("div");
      exportContainer.style.position = "fixed";
      exportContainer.style.top = "0";
      exportContainer.style.left = "0";
      exportContainer.style.width = `${containerWidth}px`;
      exportContainer.style.height = `${containerHeight}px`;
      exportContainer.style.display = "flex";
      exportContainer.style.justifyContent = "center";
      exportContainer.style.alignItems = "center";
      exportContainer.style.boxSizing = "border-box";
      // Set background color on the export container for visual feedback
      // The actual background in the export is handled by the toPng options
      exportContainer.style.backgroundColor = includeBackground
        ? theme === "dark"
          ? "#1c1f3b"
          : "#ffffff"
        : "transparent";
      exportContainer.style.zIndex = "9999";
      exportContainer.style.overflow = "hidden";

      // Create an inner container to ensure proper centering
      const innerContainer = document.createElement("div");
      innerContainer.style.position = "relative";
      innerContainer.style.width = `${fullWidth}px`;
      innerContainer.style.height = `${fullHeight}px`;
      innerContainer.style.display = "flex";
      innerContainer.style.justifyContent = "center";
      innerContainer.style.alignItems = "center";

      // Clone the timeline board
      const clone = timelineBoardElement.cloneNode(true);
      clone.style.position = "relative";
      clone.style.width = "100%";
      clone.style.height = "auto";
      clone.style.margin = "0";
      clone.style.padding = "0";
      clone.style.visibility = "visible";
      clone.style.overflow = "visible";

      // Add the clone to the inner container
      innerContainer.appendChild(clone);

      // Add the inner container to the export container
      exportContainer.appendChild(innerContainer);

      // Add the export container to the document
      document.body.appendChild(exportContainer);

      // Wait for the next frame to ensure rendering is complete
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Options for the image export
      const options = {
        backgroundColor: includeBackground
          ? theme === "dark"
            ? "#1c1f3b"
            : "#ffffff"
          : "transparent",
        width: containerWidth,
        height: containerHeight,
        pixelRatio: 2, // Higher quality
        style: {
          margin: "0",
          padding: "0",
          transform: "none",
          position: "static",
          visibility: "visible",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      };

      // Convert the export container to PNG
      const dataUrl = await toPng(exportContainer, options);

      // Clean up
      document.body.removeChild(exportContainer);
      timelineBoardElement.style.display = originalDisplay;
      timelineBoardElement.style.position = originalPosition;

      // Create and trigger download
      const link = document.createElement("a");
      link.download = "timeline-export.png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      toggleModal();
    } catch (error) {
      console.error("Error exporting timeline:", error);
      setIsExporting(false);
      toggleModal();
    }
  };

  return (
    <>
      {/* Left-justified export button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          margin: "16px 0",
        }}
      >
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

            <Flex
              justify="end"
              style={{ width: "100%", marginTop: "16px" }}
              gap={8}
            >
              <Button kind="tertiary" onClick={toggleModal}>
                Cancel
              </Button>
              <Button onClick={handleExport} isLoading={isExporting}>
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Modal>
    </>
  );
};

export default ExportButton;
