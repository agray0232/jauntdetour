import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: webcrypto,
  });
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
}

expect.extend(toHaveNoViolations);
