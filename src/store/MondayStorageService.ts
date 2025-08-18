/**
 * MondayStorageService.ts
 * 
 * A service for interacting with the Monday.com Storage API.
 * Provides methods for both instance-level and global-level storage operations.
 */
import { MondayStorageOptions, MondayStorageResponse } from '../types/monday_storage';
import TimelineLogger from '../utils/logger';
/**
 * Service for interacting with Monday.com's Storage API
 */
export class MondayStorageService {
  private monday: any;

  /**
   * Creates a new MondayStorageService
   * @param mondaySDK The Monday SDK instance
   */
  constructor(mondaySDK: any) {
    if (!mondaySDK) {
      throw new Error('Monday SDK is required for MondayStorageService');
    }
    this.monday = mondaySDK;
  }

  // Instance-level storage methods

  /**
   * Gets an item from instance-level storage
   * @param key The key to retrieve
   * @param options Storage options
   * @returns Promise with the storage response
   */
  async getInstanceItem<T = any>(key: string, options?: MondayStorageOptions): Promise<MondayStorageResponse<T>> {
    try {
      return await this.monday.storage.instance.getItem(key, options);
    } catch (error) {
      console.error('Error getting instance item:', error);
      throw error;
    }
  }

  /**
   * Sets an item in instance-level storage
   * @param key The key to store the value under
   * @param value The value to store
   * @param options Storage options
   * @returns Promise with the storage response
   */
  async setInstanceItem<T = any>(key: string, value: T, options?: MondayStorageOptions): Promise<MondayStorageResponse> {
    try {
      TimelineLogger.debug(`[StorageService] setInstanceItem: Setting key '${key}'`, { value, options });
      const response = await this.monday.storage.instance.setItem(key, value, options);
      TimelineLogger.debug(`[StorageService] setInstanceItem: Response for key '${key}'`, { response });
      return response;
    } catch (error) {
      TimelineLogger.error(`[StorageService] Error setting instance item for key '${key}'`, { error });
      throw error;
    }
  }

  /**
   * Deletes an item from instance-level storage
   * @param key The key to delete
   * @param options Storage options
   * @returns Promise with the storage response
   */
  async deleteInstanceItem(key: string, options?: MondayStorageOptions): Promise<MondayStorageResponse> {
    try {
      TimelineLogger.debug(`[StorageService] deleteInstanceItem: Deleting key '${key}'`, { options });
      const response = await this.monday.storage.instance.deleteItem(key, options);
      TimelineLogger.debug(`[StorageService] deleteInstanceItem: Response for key '${key}'`, { response });
      return response;
    } catch (error) {
      TimelineLogger.error(`[StorageService] Error deleting instance item for key '${key}'`, { error });
      throw error;
    }
  }

  // Global-level storage methods

  /**
   * Gets an item from global-level storage
   * @param key The key to retrieve
   * @param options Storage options
   * @returns Promise with the storage response
   */
  async getGlobalItem<T = any>(key: string, options?: MondayStorageOptions): Promise<MondayStorageResponse<T>> {
    try {
      return await this.monday.storage.getItem(key, options);
    } catch (error) {
      console.error('Error getting global item:', error);
      throw error;
    }
  }

  /**
   * Sets an item in global-level storage
   * @param key The key to store the value under
   * @param value The value to store
   * @param options Storage options
   * @returns Promise with the storage response
   */
  async setGlobalItem<T = any>(key: string, value: T, options?: MondayStorageOptions): Promise<MondayStorageResponse> {
    try {
      return await this.monday.storage.setItem(key, value, options);
    } catch (error) {
      console.error('Error setting global item:', error);
      throw error;
    }
  }

  /**
   * Searches for items in global-level storage
   * @param key The partial key to search for
   * @returns Promise with the storage response
   */
  async searchGlobalItems(key: string): Promise<MondayStorageResponse> {
    try {
      return await this.monday.storage.searchItem(key);
    } catch (error) {
      console.error('Error searching global items:', error);
      throw error;
    }
  }

  /**
   * Deletes an item from global-level storage
   * @param key The key to delete
   * @param options Storage options
   * @returns Promise with the storage response
   */
  async deleteGlobalItem(key: string, options?: MondayStorageOptions): Promise<MondayStorageResponse> {
    try {
      return await this.monday.storage.deleteItem(key, options);
    } catch (error) {
      console.error('Error deleting global item:', error);
      throw error;
    }
  }

  // Helper methods for common storage patterns

  /**
   * Safely updates an item with versioning to prevent race conditions
   * @param key The key to update
   * @param updateFn Function that receives the current value and returns the new value
   * @param isInstance Whether to use instance-level storage (true) or global-level storage (false)
   * @returns Promise with the updated value or null if update failed
   */
  async safeUpdate<T = any>(
    key: string, 
    updateFn: (currentValue: T | null) => T, 
    isInstance = true
  ): Promise<T | null> {
    try {
      TimelineLogger.debug(`[StorageService] safeUpdate: Starting for key '${key}'`);
      const getMethod = isInstance ? this.getInstanceItem.bind(this) : this.getGlobalItem.bind(this);
      const setMethod = isInstance ? this.setInstanceItem.bind(this) : this.setGlobalItem.bind(this);
      
      const response = await getMethod(key, { versioning: true });
      TimelineLogger.debug(`[StorageService] safeUpdate: Get response for key '${key}'`, { response: response.data });

      if (!response.data.success) {
        if (response.data.error && response.data.error.includes('not found')) {
            TimelineLogger.debug(`[StorageService] safeUpdate: Key '${key}' not found. Assuming new item.`);
        } else {
            TimelineLogger.error(`[StorageService] Failed to get item for safe update for key '${key}'`, { error: response.data.error });
            return null;
        }
      }
      
      const currentValue = response.data.value ?? null;
      const version = response.data.version;
      TimelineLogger.debug(`[StorageService] safeUpdate: Current value for key '${key}'`, { value: currentValue, version });
      const newValue = updateFn(currentValue);
      TimelineLogger.debug(`[StorageService] safeUpdate: New value for key '${key}'`, { value: newValue });

      // If the new value is an empty array, we should delete the key instead of setting it.
      if (Array.isArray(newValue) && newValue.length === 0) {
        TimelineLogger.debug(`[StorageService] safeUpdate: New value is an empty array. Deleting key '${key}'.`);
        const deleteResponse = await this.deleteInstanceItem(key);
        if (!deleteResponse.data.success) {
          TimelineLogger.error(`[StorageService] Failed to delete empty array key '${key}'`, { error: deleteResponse.data.error });
          return null;
        }
        return newValue;
      }

      const updateResponse = await setMethod(key, newValue, { 
        versioning: true,
        version
      });
      TimelineLogger.debug(`[StorageService] safeUpdate: Set response for key '${key}'`, { response: updateResponse.data });
      
      if (!updateResponse.data.success) {
        TimelineLogger.error(`[StorageService] Failed to update item safely for key '${key}'`, { error: updateResponse.data.error });
        return null;
      }
      
      TimelineLogger.debug(`[StorageService] safeUpdate: Successfully updated key '${key}'`);
      return newValue;
    } catch (error) {
      TimelineLogger.error(`[StorageService] Error in safe update for key '${key}'`, { error });
      return null;
    }
  }
}

/**
 * Creates a Monday Storage Service instance
 * @param mondaySDK The Monday SDK instance
 * @returns A new MondayStorageService instance
 */
export function createMondayStorageService(mondaySDK: any): MondayStorageService {
  return new MondayStorageService(mondaySDK);
}
