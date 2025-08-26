// transformUtils.js
import TimelineLogger from "../../utils/logger";

/**
 * Extracts translateY value from an element's transform style
 * @param {HTMLElement} element - Element to extract transform from
 * @returns {number|null} Extracted translateY value or null if not found
 */
export const extractTranslateY = (element) => {
  if (!element) return null;

  const transform = element.style.transform;
  const translateYMatch = transform.match(/translateY\(([^)]+)\)/);

  if (translateYMatch && translateYMatch[1]) {
    const translateY = translateYMatch[1];
    return parseFloat(translateY);
  }

  return null;
};

/**
 * Gets the transform matrix from computed style
 * @param {HTMLElement} element - Element to get matrix for
 * @returns {DOMMatrixReadOnly|null} The transform matrix or null if unavailable
 */
export const getTransformMatrix = (element) => {
  if (!element) return null;

  try {
    const computedStyle = window.getComputedStyle(element);
    return new DOMMatrixReadOnly(computedStyle.transform);
  } catch (err) {
    TimelineLogger.debug("[TRANSFORM] Could not get transform matrix", {
      error: err.message,
    });
    return null;
  }
};

/**
 * Applies a translateY transform to an element
 * @param {HTMLElement} element - Element to transform
 * @param {number} yPosition - Y position in pixels
 */
export const applyTranslateY = (element, yPosition) => {
  if (!element) return;

  element.style.transform = `translateY(${yPosition}px)`;

  // Store for debugging and reference
  element.dataset.transformY = yPosition;

  // Force a minimal repaint to ensure the transform is applied immediately
  void element.offsetHeight;

  TimelineLogger.debug("[TRANSFORM] Applied translateY", {
    element: element.id || "unknown",
    yPosition,
  });
};
