// src/lib/errors.ts

export const Err = {
  viewOnly:    (m = "View-only users cannot use this app."): { type: "viewOnly";    message: string } => ({ type: "viewOnly",    message: m }),
  invalidDate: (m = "Selected date column is invalid or missing."): { type: "invalidDate"; message: string } => ({ type: "invalidDate", message: m }),
  tooManyItems:     (m = "Too many items selected (max 15)."): { type: "tooManyItems"; message: string } => ({ type: "tooManyItems", message: m }),
  noItems:     (m = "No items on this board view."): { type: "noItems";     message: string } => ({ type: "noItems",     message: m }),
  loadFailed:  (m = "Failed to load data."): { type: "loadFailed";  message: string } => ({ type: "loadFailed",  message: m }),
} as const;
