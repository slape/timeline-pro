import { AttentionBox } from "@vibe/core";

const TooManyItems = () => (
  <AttentionBox
    title="Too many items on this board. Timelines will display up to 10 items."
    text="The timeline cannot be displayed because this board has more than 10 items. Remove this timeline view, use the filter to display up to 10 items, and re-generate a new timeline."
    type="danger"
  />
);

export default TooManyItems;
