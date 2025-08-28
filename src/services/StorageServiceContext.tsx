// src/services/StorageServiceContext.tsx
import React, { createContext, useContext } from "react";
import type { MondayStorageService } from "./MondayStorageService";

const StorageServiceCtx = createContext<MondayStorageService | null>(null);

export function StorageServiceProvider({
  service,
  children,
}: { service: MondayStorageService; children: React.ReactNode }) {
  return <StorageServiceCtx.Provider value={service}>{children}</StorageServiceCtx.Provider>;
}

export function useStorageService(): MondayStorageService {
  const svc = useContext(StorageServiceCtx);
  if (!svc) throw new Error("Storage service not provided. Wrap your app with <StorageServiceProvider>.");
  return svc;
}
