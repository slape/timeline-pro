// Get marker and date styles based on datePosition
const getMarkerStyles = (datePosition) => {
  const isAbove = datePosition.includes('above');
  const isAngled = datePosition.includes('angled');
  
  return {
    markerContainer: {
      flexDirection: isAbove ? 'column-reverse' : 'column',
    },
    markerLine: {
      width: '1px',
      height: '8px',
      backgroundColor: 'var(--ui-border-color)',
      [isAbove ? 'marginTop' : 'marginBottom']: '4px',
    },
    dateLabel: {
      fontSize: '10px',
      color: 'var(--secondary-text-color)',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      transform: isAngled ? 'rotate(-25deg)' : 'none',
      transformOrigin: isAbove ? 'center top' : 'center bottom',
      [isAbove ? 'marginBottom' : 'marginTop']: '4px',
    },
    positioning: {
      top: isAbove ? '50%' : '50%',
      transform: isAbove ? 'translateX(-50%) translateY(-100%)' : 'translateX(-50%)',
    }
  };
};

export default getMarkerStyles;
