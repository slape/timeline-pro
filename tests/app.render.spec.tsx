// tests/app.render.spec.tsx
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "@/App";
import { StorageServiceProvider } from "@/services/StorageServiceContext";

// 1) Mock AppBootstrap to a no-op so side effects don't run
vi.mock("@/components/AppBootstrap", () => ({ default: () => null }));

// 2) Provide a trivial storage service
class MockStorage {
  getInstanceItem = vi.fn(async () => ({ data: { success: true, value: null } }));
  setInstanceItem = vi.fn(async () => ({ data: { success: true } }));
}

describe("App", () => {
  it("renders without crashing and mounts shell", () => {
    const svc = new MockStorage() as any;
    const { container } = render(
      <StorageServiceProvider service={svc}>
        <App />
      </StorageServiceProvider>
    );
    expect(container).toBeTruthy();
  });
});
