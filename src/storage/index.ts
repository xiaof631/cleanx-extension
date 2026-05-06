import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../shared/constants";
import type { DailyStats, ExportedConfig, ListEntry, Settings } from "../shared/types";

function hasChromeStorage() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

export async function getFromStorage<T>(key: string, fallback: T): Promise<T> {
  if (!hasChromeStorage()) return fallback;
  const result = await chrome.storage.local.get(key);
  return (result[key] ?? fallback) as T;
}

export async function setInStorage<T>(key: string, value: T): Promise<void> {
  if (!hasChromeStorage()) return;
  await chrome.storage.local.set({ [key]: value });
}

export async function loadSettings(): Promise<Settings> {
  const stored = await getFromStorage<Partial<Settings>>(STORAGE_KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const cleaned = { ...settings };
  if (!cleaned.pauseUntil) delete cleaned.pauseUntil;
  await setInStorage(STORAGE_KEYS.settings, cleaned);
}

export function normalizeUsername(username: string): string {
  return username.trim().replace(/^@/, "").toLowerCase();
}

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function exportConfig(): Promise<ExportedConfig> {
  const [settings, blacklist, whitelist] = await Promise.all([
    loadSettings(),
    getFromStorage<ListEntry[]>(STORAGE_KEYS.blacklist, []),
    getFromStorage<ListEntry[]>(STORAGE_KEYS.whitelist, [])
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    blacklist,
    whitelist
  };
}

export async function importConfig(config: ExportedConfig): Promise<void> {
  if (config.version !== 1) {
    throw new Error("不支持的配置版本");
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.settings]: { ...DEFAULT_SETTINGS, ...config.settings },
    [STORAGE_KEYS.blacklist]: normalizeEntries(config.blacklist ?? []),
    [STORAGE_KEYS.whitelist]: normalizeEntries(config.whitelist ?? [])
  });
}

export function normalizeEntries(entries: ListEntry[]): ListEntry[] {
  const seen = new Set<string>();
  const normalized: ListEntry[] = [];

  for (const entry of entries) {
    const username = normalizeUsername(entry.username);
    if (!username || seen.has(username)) continue;
    seen.add(username);
    normalized.push({
      ...entry,
      username,
      reason: entry.reason ?? "import",
      createdAt: entry.createdAt ?? new Date().toISOString(),
      source: entry.source ?? "timeline"
    });
  }

  return normalized;
}

export async function resetDailyStatsIfNeeded(stats: DailyStats): Promise<DailyStats> {
  const today = todayKey();
  if (stats.date === today) return stats;
  return {
    date: today,
    hiddenCount: 0,
    scannedAccountCount: 0,
    restoreCount: 0,
    scannedUsernames: []
  };
}
