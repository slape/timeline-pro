import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPositions } from "@/lib/storage";
import type { MondayStorageService } from "@/services/MondayStorageService";

const ok = (value: any) => ({ data: { success: true, value, version: 1 } });

describe("lib/storage.getPositions (reload restores positions)", () => {
  const svc = {
    getInstanceItem: vi.fn(),
  } as unknown as MondayStorageService;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns yDelta/laneId map for provided ids", async () => { 
    (svc.getInstanceItem as any)
      .mockResolvedValueOnce(ok({ yDelta: 10 })) // id 1
      .mockResolvedValueOnce(ok({ yDelta: -5, laneId: "L42" })) // id 2
      .mockResolvedValueOnce(ok(undefined)); // id 3 missing

    const out = await getPositions(svc, "b1", ["1", "2", "3"]);

    expect(out).toEqual({
      "1": { yDelta: 10, laneId: null },
      "2": { yDelta: -5, laneId: "L42" },
      "3": undefined,
    });
  });
});
