/**
 * Full-screen test mock setup.
 * Call setupFullScreenMocks() at the top of each screen smoke test file,
 * BEFORE importing the screen component.
 *
 * Every jest.mock() call here must appear before any imports of the screened module.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// This module just documents what mocks are needed;
// the actual jest.mock() calls must be in the test file (they can't be in a helper
// because jest.mock() is hoisted to the top of the test file by babel-jest).

// Exports helpers that can be used in beforeEach/afterEach

export const mockRouterInstance = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  dismissAll: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
};

export function makeStoreHook(state: object) {
  return jest.fn((selector?: any) =>
    selector ? selector(state) : state,
  );
}
