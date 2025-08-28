// src/lib/objects.ts
export function omitUndefined<T extends object>(o: Partial<T>): Partial<T> {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
