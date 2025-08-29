// tests/lib.storage.spec.ts
import { describe, it, expect, vi } from "vitest";
import {
  getPositions,
  setPosition,
  getHidden,
  setHidden,
} from "@/lib/storage";
import type { MondayStorageService } from "@/services/MondayStorageService";

const ok = (value: any) => ({ data: { success: true, value, version: 1 } });
const okNoVal = () => ({ data: { success: true, version: 1 } });

describe("lib/storage helpers", () => {
  const svc = {
    getInstanceItem: vi.fn(),
    setInstanceItem: vi.fn(),
    safeUpdate: vi.fn(),
  } as unknown as MondayStorageService;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getPositions aggregates per-id values and normalizes missing", async () => {
    (svc.getInstanceItem as any)
      .mockResolvedValueOnce(ok({ yDelta: 10 })) // id:1
      .mockResolvedValueOnce(ok(undefined));     // id:2

    const out = await getPositions(svc, "b1", ["1", "2"]);
    expect(out).toEqual({
      "1": { yDelta: 10, laneId: null },
      "2": undefined,
    });
  });

  it("setPosition merges with defaults", async () => {
    (svc.safeUpdate as any).mockResolvedValueOnce({ yDelta: 5, laneId: "L1" });
    const out = await setPosition(svc, "b1", "99", { laneId: "L1", yDelta: 5 });
    expect(out).toEqual({ yDelta: 5, laneId: "L1" });
    expect(svc.safeUpdate).toHaveBeenCalledTimes(1);
  });

  it("getHidden returns [] by default and value when present", async () => {
    (svc.getInstanceItem as any).mockResolvedValueOnce(ok(undefined));
    expect(await getHidden(svc, "b1")).toEqual([]);

    (svc.getInstanceItem as any).mockResolvedValueOnce(ok(["a", "b"]));
    expect(await getHidden(svc, "b1")).toEqual(["a", "b"]);
  });

  it("setHidden writes once", async () => {
    (svc.setInstanceItem as any).mockResolvedValueOnce(okNoVal());
    await setHidden(svc, "b1", ["x"]);
    expect(svc.setInstanceItem).toHaveBeenCalledTimes(1);
  });
});
