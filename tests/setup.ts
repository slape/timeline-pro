import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { beforeEach } from "vitest";
import { useStore } from "@/store";

beforeEach(() => {
  useStore.getState().reset();
});

afterEach(() => cleanup());
