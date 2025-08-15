import { useZustandStore } from "../store/useZustand";

/**
 * Custom hook to extract and provide timeline settings with defaults
 * @returns {Object} Timeline settings with defaults applied
 */
export const useTimelineSettings = () => {
  const timelineParams = useZustandStore((state) => state.timelineParams) || {};
  const settings = useZustandStore((state) => state.settings) || {};

  const { startDate, endDate } = timelineParams;

  return {
    // Timeline parameters
    startDate,
    endDate,

    // Settings with defaults
    dateColumn: settings?.dateColumn,
    dateFormat: settings?.dateFormat || "MMM d, yyyy",
    datePosition: settings?.datePosition || "above",
    position: settings?.position || "center",
    scale: settings?.scale || "none",
  };
};
