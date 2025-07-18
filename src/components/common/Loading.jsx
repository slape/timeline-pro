import React from 'react';
import { Loader } from '@vibe/core';

/**
 * Loading component that displays a centered loader
 * @param {Object} props - Component props
 * @param {string} [props.size='large'] - Size of the loader ('small', 'medium', 'large')
 * @param {string} [props.color] - Color of the loader
 * @param {string} [props.message] - Optional message to display below the loader
 * @returns {JSX.Element} - Loading component
 */
const Loading = ({ size = 'large', color, message }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%' 
    }}>
      <Loader size={size} color={color} />
      {message && <div style={{ marginTop: '16px' }}>{message}</div>}
    </div>
  );
};

export default Loading;
