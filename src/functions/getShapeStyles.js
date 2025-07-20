/**
 * Generate shape-specific styles for timeline items
 * @param {string} shape - The shape type ('circle', 'oval', 'diamond', 'rectangle')
 * @returns {Object} CSS styles object for the specified shape
 */
export const getShapeStyles = (shape) => {
  switch (shape) {
    case 'circle':
      return {
        borderRadius: '50%',
        aspectRatio: '1 / 1',
        width: '100%',
        height: '100%',
      };
    case 'oval':
      return {
        borderRadius: '50%',
        aspectRatio: '1 / 1',
        width: '100%',
        height: '100%',
      };
    case 'diamond':
      return {
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        borderRadius: '3px',
      };
    case 'rectangle':
    default:
      return {
        borderRadius: '6px',
      };
  }
};
