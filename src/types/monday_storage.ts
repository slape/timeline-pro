// Types for Monday Storage API responses
export interface MondayStorageResponse<T = any> {
    method: string;
    data: {
      success: boolean;
      value?: T;
      version?: string;
      error?: string;
    };
    requestId: string;
  }
  
  export interface MondayStorageOptions {
    versioning?: boolean;
    version?: string;
  }
  