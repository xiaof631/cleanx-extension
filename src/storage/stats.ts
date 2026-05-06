import { STORAGE_KEYS } from "../shared/constants";
import type { DailyStats } from "../shared/types";
import { getFromStorage, resetDailyStatsIfNeeded, setInStorage, todayKey } from "./index";

export async function loadStats(): Promise<DailyStats> {
  const stats = await getFromStorage<DailyStats>(STORAGE_KEYS.stats, {
    date: todayKey(),
    hiddenCount: 0,
    scannedAccountCount: 0,
    restoreCount: 0
  });
  const normalized = await resetDailyStatsIfNeeded(stats);
  if (normalized.date !== stats.date) await saveStats(normalized);
  return normalized;
}

export async function saveStats(stats: DailyStats): Promise<void> {
  await setInStorage(STORAGE_KEYS.stats, stats);
}

export async function incrementHiddenCount(): Promise<void> {
  const stats = await loadStats();
  await saveStats({ ...stats, hiddenCount: stats.hiddenCount + 1 });
}

export async function incrementScannedAccountCount(): Promise<void> {
  const stats = await loadStats();
  await saveStats({ ...stats, scannedAccountCount: stats.scannedAccountCount + 1 });
}

export async function incrementRestoreCount(): Promise<void> {
  const stats = await loadStats();
  await saveStats({ ...stats, restoreCount: stats.restoreCount + 1 });
}
