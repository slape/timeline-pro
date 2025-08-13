# Timeline-Pro

A React-based timeline visualization app for Monday.com that automatically generates interactive timeline graphics from board data. Built for project managers to visualize project timelines with drag-and-drop functionality and real-time synchronization.

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with Vite build tool
- **State Management**: Zustand for centralized state management
- **UI Components**: @vibe/core component library (Monday.com's design system)
- **Platform Integration**: monday-sdk-js for Monday.com API integration
- **Visualization**: Custom timeline rendering with leader-line for visual connections
- **Drag & Drop**: react-rnd for draggable timeline items
- **Utilities**: lodash.isequal for performance optimizations, validator.js for input sanitization

## 📁 Project Structure

```
src/
├── App.jsx                    # Main app entry point & Monday.com integration
├── components/
│   ├── timeline/             # Core timeline visualization components
│   │   ├── TimelineBoard.jsx     # Main timeline container
│   │   ├── Timeline.jsx          # Core timeline with drag-drop
│   │   ├── DraggableBoardItem.jsx # Individual draggable items
│   │   ├── ScaleMarkers.jsx      # Time scale markers
│   │   ├── LeaderLineConnector.jsx # Visual connectors
│   │   ├── GroupLegend.jsx       # Color-coded group legend
│   │   └── TimelineItem.jsx      # Timeline item rendering
│   └── export/
│       └── ExportButton.jsx      # Timeline export functionality
├── functions/                # Business logic & utility functions
│   ├── processTimelineData.js    # Main data processing
│   ├── fetchBoardItems.js        # Monday.com API integration
│   ├── calculateTimelineItemPositions.js # Timeline calculations
│   ├── generateTimelineMarkers.js # Marker generation
│   └── timelineHandlers.js       # Event handlers
├── store/
│   └── useZustand.js         # Centralized state management
└── utils/
    └── logger.js             # Logging system
```

## 🔄 Data Flow Architecture

```
Monday.com Platform
        ↓ (SDK Events: context, settings, itemIds)
    App.jsx (Main Orchestrator)
        ↓ (State Updates)
    Zustand Store
        ↓ (State Consumption)
    TimelineBoard.jsx
        ↓ (Data Processing via functions/)
    Business Logic Functions
        ↓ (Processed Timeline Data)
    Timeline Components
        ↓ (User Interactions: drag, hide, edit)
    Event Handlers → State Updates
```

## 🏛️ Core Architecture Components

### 1. Entry Point & Integration (`App.jsx`)
- **Monday.com SDK Integration**: Establishes platform connection and event listeners
- **Context Management**: Handles context, settings, and itemIds changes from Monday.com
- **Data Orchestration**: Coordinates board item fetching when context/settings change
- **Theme Integration**: Wraps components with ThemeProvider for Monday.com theme consistency
- **Loading States**: Manages loading and error states throughout the app

### 2. State Management (`store/useZustand.js`)
Centralized Zustand store managing:
- **Platform Data**: `context`, `settings`, `boardItems`, `itemIds`
- **Timeline State**: `timelineItems`, `timelineParams`, `hiddenItemIds`
- **Actions**: Setters with built-in logging for debugging and performance monitoring

### 3. Timeline Components (`components/timeline/`)
- **`TimelineBoard.jsx`**: Main container orchestrating timeline rendering and data processing
- **`Timeline.jsx`**: Core timeline visualization with drag-drop functionality and visual connections
- **`DraggableBoardItem.jsx`**: Individual draggable timeline items with position management
- **`ScaleMarkers.jsx`**: Time scale markers (days, weeks, months) with dynamic positioning
- **`LeaderLineConnector.jsx`**: Visual connectors between board items and timeline markers
- **`GroupLegend.jsx`**: Color-coded legend for board groups
- **`TimelineItem.jsx`**: Individual timeline item rendering with customizable styling

### 4. Business Logic (`functions/`)
Modular utility functions handling core timeline operations:
- **Data Processing**: `processTimelineData.js`, `processBoardItems.js`
- **Timeline Calculations**: `calculateTimelineItemPositions.js`, `calculateItemSpacing.js`
- **Date Handling**: `formatDate.js`, `getUniqueDates.js`, `getItemsWithDates.js`
- **Visual Rendering**: `generateTimelineMarkers.js`, `calculateScaleMarkers.js`
- **Monday.com Integration**: `fetchBoardItems.js`
- **Event Handlers**: `timelineHandlers.js`

## ⚡ Performance Optimizations

- **Selective Re-rendering**: Uses `lodash.isequal` for deep equality checks to prevent unnecessary renders
- **Efficient State Updates**: Prevents unnecessary refetches with reference tracking and change detection
- **Modular Functions**: Separated business logic for better maintainability and code splitting
- **Logging System**: Comprehensive logging for debugging and performance monitoring
- **Optimized Calculations**: Cached timeline calculations and efficient position updates

## 📝 Development Notes for LLMs

This architecture follows modern React patterns while being specifically tailored for Monday.com's platform requirements. Key considerations for future development:

1. **State Management**: All state changes should go through Zustand store actions with proper logging
2. **Component Structure**: Keep timeline logic in `components/timeline/` and business logic in `functions/`
3. **Monday.com Integration**: Use SDK event listeners in `App.jsx` and handle data fetching through `fetchBoardItems.js`
4. **Performance**: Always use equality checks before state updates to prevent unnecessary re-renders
5. **UI Components**: Use @vibe/core components exclusively for consistency with Monday.com design system
6. **Logging**: Utilize the TimelineLogger for debugging and performance monitoring