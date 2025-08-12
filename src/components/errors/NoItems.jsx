import { AttentionBox } from '@vibe/core';

const NoItems = () => (
  <AttentionBox
    title="No valid items found on this board."
    text="The timeline cannot be displayed because this board has no items. Add 1 to 15 items with a date or timeline column to your board and re-generate a new timeline."
    type="danger"
  />
);

export default NoItems;
