export type ColumnValue = {
  id: string;
  value: string;
}

export type Group = {
  id: string;
  title: string;
  color: string;
}

export type Board = {
  id: string;
}

export type BoardItem = {
  id: string;
  /** Display name */
  name: string;
  board: Board;
  group: Group;
  column_values: ColumnValue[];
}

/** Derived runtime item for the timeline (from a monday BoardItem + selected date column). */
export type TimelineItem = {
  id: string;                 // same as monday item id
  name: string;
  date: string;               // ISO from selected date column
  groupId: string | undefined; // item.group.id
  originalItem: BoardItem;    // full reference for render/export
  // internal-only positioning (persisted to app storage)
  laneId?: string;
  yDelta?: number;
};


