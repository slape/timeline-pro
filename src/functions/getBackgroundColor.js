// Function to get background color based on setting
const getBackgroundColor = (backgroundSetting) => {
  switch (backgroundSetting) {
    case 'light':
      return '#ffffff';
    case 'dark':
      return 'var(--primary-background-color)';
    case 'none':
      return 'transparent';
    default:
      return 'var(--primary-background-color)'; // Default to dark
  }
};

export default getBackgroundColor;
