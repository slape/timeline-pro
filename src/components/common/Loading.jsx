import React, { useState, useEffect } from "react";
import { Loader } from "@vibe/core";
import NoItems from "../errors/NoItems";

/**
 * Loading component that displays a centered loader with timeout fallback
 * @param {Object} props - Component props
 * @param {string} [props.size='medium'] - Size of the loader ('small', 'medium', 'large')
 * @param {number} [props.timeout=10000] - Timeout in milliseconds before showing error (default: 30 seconds)
 * @param {function} [props.onTimeout] - Callback function when timeout occurs
 * @returns {JSX.Element} - Loading component
 */
const Loading = ({ size = "medium", timeout = 10000, onTimeout }) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHasTimedOut(true);
      if (onTimeout) {
        onTimeout();
      }
    }, timeout);

    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutId);
  }, [timeout, onTimeout]);

  if (hasTimedOut) {
    return <NoItems />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "600px",
      }}
    >
      <Loader size={size} color="secondary" />
    </div>
  );
};

export default Loading;
