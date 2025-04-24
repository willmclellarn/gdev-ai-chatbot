export const isProductionEnvironment = process.env.NODE_ENV === "production";

export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

// lib/utils/chunking.ts
export const CHUNKING_STRATEGIES = [
  "gemini-genius",
  "token",
  // "headers",
  // "centered",
  // "html",
  // "keyword",
  "auto",
] as const;
