// src/App.tsx
import { ThemeProvider } from "@vibe/core";
import { useStore } from "./store";
import AppBootstrap from "./components/AppBootstrap";
import ErrorBanner from "./components/";
import TimelineCanvas from "./components/Timeline/TimelineCanvas";
import ToolBar from "./components/ToolBar";

/**
 * Root App component.
 * - Provides theme from monday context via @vibe/core ThemeProvider.
 * - Runs AppBootstrap to initialize listeners and persistence.
 * - Renders global guards + timeline UI.
 */
export default function App() {
  const theme = useStore((s) => s.context?.theme ?? "light");

  return (
    <ThemeProvider systemTheme={theme}>
      <AppBootstrap />
      <ErrorBanner />
      <TimelineCanvas />
      <ToolBar />
    </ThemeProvider>
  );
}
