import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const customConfig: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^.+\\.css$": "<rootDir>/__mocks__/styleMock.ts",
    "^uuid$": "<rootDir>/__mocks__/uuid.ts",
    // The SWC transform rewrites `@/` in import statements, but not in string
    // arguments to `jest.mock(...)`; map the alias so those resolve too.
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};

export default createJestConfig(customConfig);
