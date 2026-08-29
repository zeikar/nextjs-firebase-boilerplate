/**
 * Shared setup for the client-side tests: jest-dom's matchers plus React
 * Testing Library's between-test cleanup. Imported explicitly by each client
 * test file rather than wired in as a global `setupFiles`, because the
 * server-side suites run in the `node` environment and must not load a DOM.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);
