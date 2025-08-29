import { describe, it, expect } from "vitest";
import { transformMondayItems } from "@/lib/board_items/transformItems";

const settings = {
  titleText: null, title: null,
  dateColumn: { date: true }, // MUST match column_values[].id
  dateFormat: "mdy",
  datePosition: null, scale: null, position: null, shape: null, ledger: null, itemDates: null,
} as any;

describe("transformMondayItems extras", () => {
  it("keeps originalItem, groupId, and defaults name", () => {
    const raw = [{
      id: "10",
      name: "", // blank -> should default after code tweak
      board: { id: "b1" },
      group: { id: "G1", title: "Grp", color: "#abc" },
      column_values: [{ id: "date", value: JSON.stringify({ date: "2025-09-01" }) }],
    }];

    const out = transformMondayItems(raw as any, settings);
    expect(out).toHaveLength(1);
    expect(out[0].originalItem).toBeDefined();
    expect(out[0].groupId).toBe("G1");
    expect(out[0].name).toBe("Untitled");
  });

  it("uses timeline.from when provided", () => {
    const raw = [{
      id: "11",
      name: "TL",
      board: { id: "b1" },
      group: { id: "G1", title: "Grp", color: "#abc" },
      column_values: [{ id: "date", value: JSON.stringify({ from: "2025-09-03", to: "2025-09-05" }) }],
    }];

    const out = transformMondayItems(raw as any, settings);
    expect(out).toHaveLength(1);
    expect(out[0].date).toBe("2025-09-03T00:00:00Z");
  });
});
