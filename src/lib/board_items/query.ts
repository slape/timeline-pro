// src/lib/queries.ts
export const FETCH_ITEMS_WITH_DATES = `
  query FetchItemsWithDates($ids: [ID!]!) {
    items(ids: $ids) {
      id
      name
      board { id }
      group { id title color }

      # Only return date-related columns
      column_values(types: [date, timeline]) {
        id
        type
        value       # raw JSON for anything else

        # These fragments run only when the column type matches:
        ... on DateValue {
          date
        }
        ... on TimelineValue {
          from
          to
        }
      }
    }
  }
`;
