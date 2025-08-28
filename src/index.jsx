// src/index.jsx
import "./init";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import mondaySdk from "monday-sdk-js";
import { StorageServiceProvider } from "./services/StorageServiceContext";
import { createMondayStorageService } from "./services/MondayStorageService";

const monday = mondaySdk();
const storageService = createMondayStorageService(monday);
const root = createRoot(document.getElementById("root"));

root.render(
  <StorageServiceProvider service={storageService}>
    <App />
  </StorageServiceProvider>,
);
