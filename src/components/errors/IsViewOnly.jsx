import { AttentionBox } from "@vibe/core";

const IsViewOnly = () => (
  <AttentionBox
    title="User is in view only mode"
    text="The timeline cannot be displayed because the user is in view only mode."
    type="danger"
  />
);

export default IsViewOnly;
