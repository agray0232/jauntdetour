import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: webcrypto,
  });
}

expect.extend(toHaveNoViolations);
