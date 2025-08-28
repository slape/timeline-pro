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

// ---- Minimal monday context we actually use ----
export type MondayUser = {
  id: string;
  isAdmin: boolean;
  isGuest: boolean;
  isViewOnly: boolean;
  countryCode?: string;
};

export type MondayContextMinimal = {
  theme: "light" | "dark";
  user: MondayUser;
  boardId?: string | null;
};

// ---- Helpers (optional) ----
export type PosValue = { yDelta?: number; laneId?: string };
export const hiddenKey = (boardId: string) => `tp:hidden:${boardId}`;
export const settingsKey = (boardId: string) => `tp:settings:${boardId}`;
export const posKey = (boardId: string, itemId: string) => `tp:pos:${boardId}:${itemId}`;
