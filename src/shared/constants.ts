import type { Settings } from "./types";

export const STORAGE_KEYS = {
  settings: "cleanx:settings",
  blacklist: "cleanx:blacklist",
  whitelist: "cleanx:whitelist",
  stats: "cleanx:stats",
  detectionLog: "cleanx:detectionLog"
} as const;

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  level: "standard",
  hiddenMode: "hide",
  showPlaceholder: true
};

export const THRESHOLDS = {
  light: { collapse: 80, hide: 85 },
  standard: { collapse: 50, hide: 60 },
  strict: { collapse: 35, hide: 45 }
} as const;

export const PROCESSED_ATTR = "data-cleanx-processed";
export const HIDDEN_ATTR = "data-cleanx-hidden";
