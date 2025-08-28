// src/components/ErrorBanner.tsx
import { useStore } from "../store";

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
      title = "Too Many Items";
      break;
    case "noItems":
      title = "No Items";
      break;
  }

  return (
    <div
      role="alert"
      className="tp-error-banner p-4 bg-red-50 border border-red-300 text-red-800 rounded-md mb-4"
    >
      <h3 className="font-semibold">{title}</h3>
      <p>{error.message}</p>
    </div>
  );
}
