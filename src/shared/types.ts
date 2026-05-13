export type FilterLevel = "light" | "standard" | "strict";
export type HiddenMode = "hide" | "collapse" | "blur";
export type ContentType = "tweet" | "comment" | "search" | "profile_card";
export type ContentSource = "timeline" | "comment" | "search" | "profile";
export type DetectionAction = "show" | "collapse" | "hide";

export interface AccountInfo {
  userId?: string;
  username: string;
  displayName?: string;
  bio?: string;
  profileUrl?: string;
  externalUrl?: string;
}

export interface ContentInfo {
  id?: string;
  type: ContentType;
  text?: string;
  url?: string;
  source: ContentSource;
}

export interface DetectionReason {
  ruleId: string;
  label: string;
  score: number;
}

export interface DetectionResult {
  score: number;
  action: DetectionAction;
  reasons: DetectionReason[];
}

export interface Settings {
  enabled: boolean;
  level: FilterLevel;
  hiddenMode: HiddenMode;
  pauseUntil?: string;
  showPlaceholder: boolean;
}

export interface ListEntry {
  userId?: string;
  username: string;
  displayName?: string;
  reason: "manual" | "rule" | "import";
  createdAt: string;
  source: ContentSource;
}

export interface DailyStats {
  date: string;
  hiddenCount: number;
  scannedAccountCount: number;
  restoreCount: number;
  scannedUsernames?: string[];
}

export interface DetectionLogEntry {
  username: string;
  displayName?: string;
  source: ContentSource;
  action: DetectionAction;
  score: number;
  reasons: DetectionReason[];
  firstSeenAt: string;
  lastSeenAt: string;
  seenCount: number;
}

export interface ExportedConfig {
  version: 1;
  exportedAt: string;
  settings: Settings;
  blacklist: ListEntry[];
  whitelist: ListEntry[];
}

export interface ExtractedPayload {
  account: AccountInfo;
  content: ContentInfo;
}

export interface BatchBlockRequest {
  type: "cleanx:block-usernames";
  usernames: string[];
}

export interface BatchBlockResultItem {
  username: string;
  status: "blocked" | "not_found" | "failed";
  message?: string;
}

export interface BatchBlockResponse {
  ok: boolean;
  results: BatchBlockResultItem[];
}
