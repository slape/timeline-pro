import { describe, it, expect } from "vitest";
import { transformMondayItems } from "@/lib/board_items/transformItems";

describe("transformMondayItems", () => {
  const settings = { dateColumn: { date_abc: true } } as any;

  it("skips items without date in the active column", () => {
    const raw = [{
      id: "1", name: "NoDate", group: { id: "g1" },
      column_values: [{ id: "date_other", value: JSON.stringify({ date: "2025-09-01" }) }]
    }];
    const out = transformMondayItems(raw, settings);
    expect(out.length).toBe(0);
  });

  it("maps items with JSON date", () => {
    const raw = [{
      id: "2", name: "HasDate", group: { id: "g1" },
      column_values: [{ id: "date_abc", value: JSON.stringify({ date: "2025-09-01", time: "12:34" }) }]
    }];
    const out = transformMondayItems(raw, settings);
    expect(out.length).toBe(1);
    expect(out[0].id).toBe("2");
    expect(out[0].date).toContain("2025-09-01");
  });

  it("accepts plain yyyy-mm-dd string", () => {
    const raw = [{
      id: "3", name: "Plain", group: { id: "g1" },
      column_values: [{ id: "date_abc", value: "2025-10-05" }]
    }];
    const out = transformMondayItems(raw, settings);
    expect(out.length).toBe(1);
    expect(out[0].date).toContain("2025-10-05");
  });
});
