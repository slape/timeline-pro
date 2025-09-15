// src/components/ErrorBanner.tsx
import { useStore } from "@/store";
import { AttentionBox } from "@vibe/core";

export default function ErrorBanner() {
  const error = useStore((s) => s.error);

  if (!error) return null;

  let title = "Error";
  switch (error.type) {
    case "viewOnly":
      title = "Access Restricted";
      break;
    case "invalidDate":
      title = "Invalid Date Column";
      break;
    case "tooManyItems":
      title = "Too Many Board Items";
      break;
    case "noItems":
      title = "No Items";
      break;
  }

  return (
    <div
  style={{
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh'
}}
>
  <AttentionBox
    text={error.message}
    title={title}
  />
</div>
  );
}
