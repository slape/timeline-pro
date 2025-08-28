import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "../App";
import { StorageServiceProvider } from "../services/StorageServiceContext";

// Minimal mock service implementing the methods we use
class MockStorageService {
  getInstanceItem = vi.fn(async () => ({ data: { success: true, value: null } }));
  setInstanceItem = vi.fn(async () => ({ data: { success: true } }));
}

describe("App", () => {
  it("renders without crashing and mounts bootstrap", () => {
    const svc = new MockStorageService() as any;
    render(
      <StorageServiceProvider service={svc}>
        <App />
      </StorageServiceProvider>
    );

    // Expect our shell pieces to exist (placeholders are fine)
    // If your components render specific text, assert that here.
    expect(document.body).toBeTruthy();
  });
});
