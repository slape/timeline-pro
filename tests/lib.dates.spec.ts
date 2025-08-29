import { describe, it, expect } from "vitest";
import { parseMondayDateColumn, parseSelectedDateFromItem, formatForUI } from "@/lib/dates";
import type { BoardItem, ColumnValue } from "@/types/Item";

const mkCol = (id: string, value: any): ColumnValue => ({
  id,
  value: JSON.stringify(value),
});
const mk = (id: string, v: any) => ({ id, value: JSON.stringify(v), text: "", type: "date" });

describe("dates.ts", () => {
  it("parseMondayDateColumn handles date column (with time)", () => {
    const col = mkCol("date", { date: "2025-09-01", time: "13:30" });
    expect(parseMondayDateColumn(col)).toBe("2025-09-01T13:30:00Z");
  });

  it("parseMondayDateColumn handles date column (no time)", () => {
    const col = mkCol("date", { date: "2025-09-01" });
    expect(parseMondayDateColumn(col)).toBe("2025-09-01T00:00:00Z");
  });

  it("parseMondayDateColumn handles timeline (from)", () => {
    const col = mkCol("timeline", { from: "2025-09-03", to: "2025-09-05" });
    expect(parseMondayDateColumn(col)).toBe("2025-09-03T00:00:00Z");
  });

  it("parseSelectedDateFromItem finds the correct column", () => {
    const item: BoardItem = {
      id: "1",
      board: { id: "b1" },
      name: "X",
      group: { id: "g1", title: "Group", color: "#f00" },
      column_values: [
        mkCol("other", { date: "2025-01-01" }),
        mkCol("target", { date: "2025-02-02", time: "08:15" }),
      ],
    };
    expect(parseSelectedDateFromItem(item, "target")).toBe("2025-02-02T08:15:00Z");
  });

  it("formatForUI supports mdy|mdyy|md", () => {
    expect(formatForUI("2025-09-01T00:00:00Z", "mdy")).toBe("9/1/2025");
    expect(formatForUI("2025-09-01T00:00:00Z", "mdyy")).toBe("9/1/25");
    expect(formatForUI("2025-09-01T00:00:00Z", "md")).toBe("9/1");
  });
});

describe("dates.ts extras", () => {
  it("formatForUI outputs expected strings", () => {
    expect(formatForUI("2025-09-01T00:00:00Z", "mdy")).toBe("9/1/2025");
    expect(formatForUI("2025-09-01T00:00:00Z", "mdyy")).toBe("9/1/25");
    expect(formatForUI("2025-09-01T00:00:00Z", "md")).toBe("9/1");
  });

  it("parseMondayDateColumn covers date/time and timeline", () => {
    expect(parseMondayDateColumn(mk("d", { date: "2025-09-01" }))).toBe("2025-09-01T00:00:00Z");
    expect(parseMondayDateColumn(mk("d", { date: "2025-09-01", time: "07:30" }))).toBe("2025-09-01T07:30:00Z");
    expect(parseMondayDateColumn(mk("t", { from: "2025-09-03", to: "2025-09-05" }))).toBe("2025-09-03T00:00:00Z");
  });

  it("parseMondayDateColumn safely ignores invalid JSON / 'null'", () => {
    expect(parseMondayDateColumn({ id: "x", value: "null", text: "", type: "date" } as any)).toBeNull();
    expect(parseMondayDateColumn({ id: "x", value: "{notjson", text: "", type: "date" } as any)).toBeNull();
  });
});
