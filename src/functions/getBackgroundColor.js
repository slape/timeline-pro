// Function to get background color based on setting
const getBackgroundColor = (backgroundSetting) => {
  switch (backgroundSetting) {
    case 'light':
      return '#ffffff';
    case 'dark':
      return '#36454F'; // Charcoal color for dark mode
    case 'none':
      return 'transparent';
    default:
      return '#36454F'; // Default to charcoal dark
  }
};

export default getBackgroundColor;
