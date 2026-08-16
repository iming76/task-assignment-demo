import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import "@testing-library/jest-dom/vitest";

// The Vite config does not enable Vitest's `test.globals`, so React Testing
// Library's automatic afterEach(cleanup) never registers; do it explicitly
// or DOM from one test leaks into the next.
afterEach(() => {
  cleanup();
});

// jsdom does not implement the Pointer Events APIs that Radix UI's Select
// relies on for interaction; these no-op stand-ins let it operate in tests.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
