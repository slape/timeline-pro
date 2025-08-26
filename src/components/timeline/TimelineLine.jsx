import React from "react";

/**
 * TimelineLine component renders the main horizontal timeline line
 *
 * @param {string} position - Position of items relative to timeline ('above', 'below', 'center')
 * @returns {JSX.Element} Timeline line element
 */
const TimelineLine = ({ position }) => {
  const getTimelineTop = () => {
    switch (position) {
      case "above":
        return "75%";
      case "below":
        return "25%";
      default:
        return "50%";
    }
  };

  return (
    <div
      className="timeline-line"
      style={{
        position: "absolute",
        top: getTimelineTop(),
        left: 0,
        width: "100%",
        height: "2px",
        backgroundColor: "var(--ui-border-color)",
        zIndex: 0,
        pointerEvents: "none", // Ensure this line doesn't capture events
      }}
      onMouseDown={(e) => {
        e.stopPropagation(); // Stop event propagation as a fallback
        e.preventDefault();
      }}
    />
  );
};

export default TimelineLine;
