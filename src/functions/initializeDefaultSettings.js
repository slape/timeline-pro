import mondaySdk from "monday-sdk-js";
import TimelineLogger from '../utils/logger';

const monday = mondaySdk();

/**
 * Default settings for the timeline app
 */
const DEFAULT_SETTINGS = {
  titleText: "Project Timeline",
  title: true,
  dateFormat: "MMM DD",
  datePosition: "top",
  scale: "weeks",
  position: "center",
  shape: "circle",
  ledger: true,
  itemDates: true
};

/**
 * Checks if the settings appear to be from a first-time app launch
 * (most values are null/false except dateColumn)
 * @param {Object} settings - Settings object from Monday.com
 * @returns {boolean} - True if this appears to be first-time launch
 */
export const isFirstTimeLaunch = (settings) => {
  if (!settings || !settings.dateColumn) {
    return false;
  }

  // More specific check: if we have a scale value set to our default, it's likely already initialized
  if (settings.scale === 'weeks' && settings.titleText === 'Project Timeline') {
    return false;
  }

  // Check if critical settings are null/undefined (not just empty string or false)
  const criticalSettings = ['scale', 'dateFormat', 'datePosition'];
  const nullCount = criticalSettings.filter(key => {
    const value = settings[key];
    return value === null || value === undefined;
  }).length;

  // If most critical settings are null and we have a dateColumn, it's likely first-time
  return nullCount >= 2;
};

/**
 * Creates complete settings by merging provided settings with defaults
 * @param {Object} incompleteSettings - Settings from Monday.com (likely incomplete)
 * @returns {Object} - Complete settings object with defaults applied
 */
export const createCompleteSettings = (incompleteSettings) => {
  const completeSettings = {
    ...DEFAULT_SETTINGS,
    ...incompleteSettings
  };

  // Ensure we preserve the dateColumn from the original settings
  if (incompleteSettings?.dateColumn) {
    completeSettings.dateColumn = incompleteSettings.dateColumn;
  }

  TimelineLogger.info('Created complete settings with defaults', {
    original: incompleteSettings,
    complete: completeSettings
  });

  return completeSettings;
};

/**
 * Initializes default settings on first app launch
 * Detects incomplete settings, adds defaults, and syncs back to Monday.com
 * @param {Object} settings - Settings received from Monday.com
 * @param {Function} setSettings - Zustand setter for settings
 * @param {boolean} isSettingsInitialized - Flag indicating if settings have been initialized
 * @param {Function} setSettingsInitialized - Zustand setter for initialization flag
 * @returns {Promise<Object>} - Complete settings object
 */
export const initializeDefaultSettings = async (settings, setSettings, isSettingsInitialized, setSettingsInitialized) => {
  try {
    // If we've already initialized settings, just use them as-is
    if (isSettingsInitialized) {
      TimelineLogger.debug('Settings already initialized, using as-is');
      setSettings(settings);
      return settings;
    }

    // If this is not a first-time launch, mark as initialized and proceed normally
    if (!isFirstTimeLaunch(settings)) {
      TimelineLogger.debug('Not first-time launch, marking as initialized');
      setSettingsInitialized(true);
      setSettings(settings);
      return settings;
    }

    TimelineLogger.info('First-time launch detected, applying default settings locally');
    
    const completeSettings = createCompleteSettings(settings);
    
    // Mark as initialized and store settings locally
    setSettingsInitialized(true);
    setSettings(completeSettings);
    
    TimelineLogger.info('Default settings applied locally (not synced to Monday.com to prevent loops)', completeSettings);
    
    // NOTE: We intentionally do NOT call monday.set() here to prevent infinite loops
    // The user can save their settings through normal UI interactions if desired
    
    return completeSettings;
    
  } catch (error) {
    TimelineLogger.error('Error initializing default settings', error);
    // Fallback: mark as initialized and use the settings as-is if there's an error
    setSettingsInitialized(true);
    setSettings(settings);
    return settings;
  }
};
