/**
 * Format date based on the specified format type
 * @param {Date} date - Date to format
 * @param {string} format - Format type ('mdyy', 'mmddyyyy', 'md', 'mdy')
 * @returns {string} - Formatted date string
 */
const formatDate = (date, format = "mdyy") => {
  // Validate that date is defined and is a valid Date object
  if (!date || isNaN(date.getTime())) {
    console.warn("Invalid date provided to formatDate:", date);
    return "Invalid date";
  }
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  switch (format) {
    case "mdyy":
      return `${month}/${day}/${date.getFullYear().toString().slice(-2)}`;
    case "mmddyyyy":
      return `${month}/${day}/${date.getFullYear()}`;
    case "md":
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    case "mdy":
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    default:
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`;
  }
};

export default formatDate;
