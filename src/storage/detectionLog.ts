import { STORAGE_KEYS } from "../shared/constants";
import type { DetectionLogEntry, DetectionResult, ExtractedPayload } from "../shared/types";
import { getFromStorage, normalizeUsername, setInStorage } from "./index";

const MAX_LOG_ENTRIES = 100;

export async function loadDetectionLog(): Promise<DetectionLogEntry[]> {
  return getFromStorage<DetectionLogEntry[]>(STORAGE_KEYS.detectionLog, []);
}

export async function clearDetectionLog(): Promise<void> {
  await setInStorage(STORAGE_KEYS.detectionLog, []);
}

export async function recordDetection(payload: ExtractedPayload, result: DetectionResult): Promise<void> {
  const username = normalizeUsername(payload.account.username);
  if (!username) return;

  const now = new Date().toISOString();
  const log = await loadDetectionLog();
  const existing = log.find((entry) => entry.username === username);

  if (existing) {
    existing.displayName = payload.account.displayName ?? existing.displayName;
    existing.source = payload.content.source;
    existing.action = result.action;
    existing.score = result.score;
    existing.reasons = result.reasons;
    existing.lastSeenAt = now;
    existing.seenCount += 1;
  } else {
    log.unshift({
      username,
      displayName: payload.account.displayName,
      source: payload.content.source,
      action: result.action,
      score: result.score,
      reasons: result.reasons,
      firstSeenAt: now,
      lastSeenAt: now,
      seenCount: 1
    });
  }

  log.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
  await setInStorage(STORAGE_KEYS.detectionLog, log.slice(0, MAX_LOG_ENTRIES));
}
