/**
 * Generate shape-specific styles for timeline items
 * @param {string} shape - The shape type ('circle', 'rectangle')
 * @returns {Object} CSS styles object for the specified shape
 */
export const getShapeStyles = (shape) => {
  switch (shape) {
    case "circle":
      return {
        borderRadius: "50%",
        aspectRatio: "1 / 1",
        width: "100%",
        height: "100%",
      };

    case "rectangle":
    default:
      return {
        borderRadius: "6px",
      };
  }
};
