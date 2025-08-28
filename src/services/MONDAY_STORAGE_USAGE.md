# Monday.com Storage Service

This document provides guidance on using the Monday.com Storage Service in the FreshBooks Integration application.

## Overview

The Monday.com Storage API provides a persistent key-value storage solution that allows you to store data without creating your own backend or maintaining a separate database. The service we've implemented offers both instance-level and global-level storage capabilities.

### Storage Limits

- **Key length limit**: 256 characters
- **Storage limit per key**: 6MB

## Service Components

Our implementation consists of two main components:

1. **MondayStorageService** - Core service that handles direct API interactions
2. **useMondayStorage** - React hook for easy integration in components

## MondayStorageService

The `MondayStorageService` class provides methods for interacting with both instance and global storage.

### Instance-Level Storage

Instance-level storage is tied to a specific app instance (e.g., a board view or dashboard widget). Each instance maintains its own storage and cannot share data with other instances.

```typescript
// Initialize the service
const storageService = new MondayStorageService(mondaySDK);

// Get an item
const response = await storageService.getInstanceItem('myKey');
const value = response.data.success ? response.data.value : null;

// Set an item
await storageService.setInstanceItem('myKey', { data: 'example' });

// Delete an item
await storageService.deleteInstanceItem('myKey');
```

### Global-Level Storage

Global-level storage is shared across all instances of your app within an account. It's not tied to a specific instance.

```typescript
// Get an item
const response = await storageService.getGlobalItem('myKey');
const value = response.data.success ? response.data.value : null;

// Set an item
await storageService.setGlobalItem('myKey', { data: 'example' });

// Search for items with a partial key match
const searchResults = await storageService.searchGlobalItems('my');

// Delete an item
await storageService.deleteGlobalItem('myKey');
```

### Versioning

Both instance and global storage support versioning to prevent race conditions when multiple users update the same data. The service includes a `safeUpdate` helper method to handle versioning automatically:

```typescript
// Safely update a value with versioning
const updatedValue = await storageService.safeUpdate(
  'myKey',
  (currentValue) => {
    // Modify the current value and return the new value
    return { ...currentValue, count: (currentValue?.count || 0) + 1 };
  },
  true // true for instance storage, false for global storage
);
```

## React Hook: useMondayStorage

For React components, we provide the `useMondayStorage` hook that wraps the storage service with React state management:

```typescript
import { useMondayStorage } from '@/hooks/useMondayStorage';

function MyComponent({ mondaySDK }) {
  const { 
    // State
    isLoading,
    error,
    isInitialized,
    
    // Instance methods
    getInstanceItem,
    setInstanceItem,
    deleteInstanceItem,
    
    // Global methods
    getGlobalItem,
    setGlobalItem,
    searchGlobalItems,
    deleteGlobalItem,
    
    // Helper methods
    safeUpdate
  } = useMondayStorage({ mondaySDK });

  // Example usage
  const handleSaveData = async () => {
    const result = await setGlobalItem('userData', { name: 'John', role: 'Admin' });
    if (result?.data.success) {
      console.log('Data saved successfully!');
    }
  };

  // ...
}
```

## Common Use Cases

### Storing User Preferences

```typescript
// Save user preferences
await setGlobalItem('userPreferences', {
  theme: 'dark',
  notifications: true,
  defaultView: 'board'
});

// Retrieve user preferences
const response = await getGlobalItem('userPreferences');
const preferences = response?.data.value || defaultPreferences;
```

### Caching API Responses

```typescript
// Cache API response with expiration
await setInstanceItem('apiCache', {
  data: apiResponse,
  timestamp: Date.now(),
  expiresIn: 3600000 // 1 hour in milliseconds
});

// Retrieve cached data if not expired
const response = await getInstanceItem('apiCache');
const cache = response?.data.value;

if (cache && (Date.now() - cache.timestamp) < cache.expiresIn) {
  // Use cached data
  return cache.data;
} else {
  // Fetch fresh data
  // ...
}
```

### Storing App State

```typescript
// Store current app state
await setInstanceItem('appState', {
  currentView: 'list',
  filters: { status: 'active' },
  sortBy: 'createdAt'
});

// Restore app state
const response = await getInstanceItem('appState');
const savedState = response?.data.value;
if (savedState) {
  // Apply saved state
  setView(savedState.currentView);
  setFilters(savedState.filters);
  setSortBy(savedState.sortBy);
}
```

## Best Practices

1. **Use versioning for critical data**: When multiple users might update the same data, always use versioning to prevent race conditions.

2. **Choose the right storage level**: Use instance storage for data specific to a view or widget, and global storage for data that should be shared across the entire app.

3. **Handle errors gracefully**: Always check for success in the response and provide fallbacks for missing data.

4. **Respect storage limits**: Keep in mind the 6MB limit per key. For larger data, consider splitting it across multiple keys or using external storage.

5. **Cache responsibly**: When caching API responses, always include an expiration mechanism to ensure data freshness.

## Troubleshooting

### Common Issues

1. **Version mismatch errors**: These occur when trying to update data that has been modified elsewhere. Use the `safeUpdate` method to handle these cases.

2. **Storage limit exceeded**: If you're hitting the 6MB limit, consider optimizing your data structure or splitting data across multiple keys.

3. **Initialization errors**: Ensure the Monday SDK is properly initialized before using the storage service.

### Debugging

The storage service includes error logging for all operations. Check your browser console for detailed error messages when issues occur.

## Further Reading

- [Monday.com Storage API Documentation](https://developer.monday.com/apps/docs/storage)
- [Monday.com SDK Documentation](https://github.com/mondaycom/monday-sdk-js)
