import React, { useEffect, useRef } from 'react';
import 'leader-line'; // Might need dynamic import in some builds

const LeaderLineConnector = ({ fromId, toId }) => {
  const lineRef = useRef(null);

  useEffect(() => {
    const LeaderLine = require('leader-line'); // Dynamic import workaround for SSR issues

    const fromElem = document.getElementById(fromId);
    const toElem = document.getElementById(toId);

    if (fromElem && toElem) {
      lineRef.current = new LeaderLine(
        fromElem,
        toElem,
        {
          color: '#333',
          path: 'straight',
          startPlug: 'behind',
          endPlug: 'arrow1',
          size: 2,
        }
      );
    }

    const updatePosition = () => {
      if (lineRef.current) {
        lineRef.current.position();
      }
    };

    window.addEventListener('resize', updatePosition);

    const interval = setInterval(updatePosition, 16); // Update ~60fps

    return () => {
      if (lineRef.current) {
        lineRef.current.remove();
      }
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
    };
  }, [fromId, toId]);

  return null; // This component only manages the line
};

export default LeaderLineConnector;
