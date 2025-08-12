/**
 * MondayStorageService.ts
 * 
 * A service for interacting with the Monday.com Storage API.
 * Provides methods for both instance-level and global-level storage operations.
 */
import { MondayStorageOptions, MondayStorageResponse } from '../types/monday_storage';
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
      return await this.monday.storage.instance.setItem(key, value, options);
    } catch (error) {
      console.error('Error setting instance item:', error);
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
      return await this.monday.storage.instance.deleteItem(key, options);
    } catch (error) {
      console.error('Error deleting instance item:', error);
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
      // Get current value with version
      const getMethod = isInstance ? this.getInstanceItem.bind(this) : this.getGlobalItem.bind(this);
      const setMethod = isInstance ? this.setInstanceItem.bind(this) : this.setGlobalItem.bind(this);
      
      const response = await getMethod(key, { versioning: true });
      
      if (!response.data.success) {
        console.error('Failed to get item for safe update:', response.data.error);
        return null;
      }
      
      // Calculate new value
      const currentValue = response.data.value ?? null;
      const version = response.data.version;
      const newValue = updateFn(currentValue);
      
      // Set with version check
      const updateResponse = await setMethod(key, newValue, { 
        versioning: true,
        version
      });
      
      if (!updateResponse.data.success) {
        console.error('Failed to update item safely:', updateResponse.data.error);
        return null;
      }
      
      return newValue;
    } catch (error) {
      console.error('Error in safe update:', error);
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
