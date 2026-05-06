import { STORAGE_KEYS } from "../shared/constants";
import type { AccountInfo, ContentSource, ListEntry } from "../shared/types";
import { getFromStorage, normalizeEntries, normalizeUsername, setInStorage } from "./index";

export async function loadBlacklist(): Promise<ListEntry[]> {
  const entries = await getFromStorage<ListEntry[]>(STORAGE_KEYS.blacklist, []);
  return normalizeEntries(entries);
}

export async function isBlacklisted(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const entries = await loadBlacklist();
  return entries.some((entry) => entry.username === normalized);
}

export async function addToBlacklist(
  account: AccountInfo,
  source: ContentSource,
  reason: ListEntry["reason"] = "manual"
): Promise<void> {
  const entries = await loadBlacklist();
  const username = normalizeUsername(account.username);
  if (!username || entries.some((entry) => entry.username === username)) return;

  entries.unshift({
    userId: account.userId,
    username,
    displayName: account.displayName,
    reason,
    createdAt: new Date().toISOString(),
    source
  });

  await setInStorage(STORAGE_KEYS.blacklist, entries);
}

export async function removeFromBlacklist(username: string): Promise<void> {
  const normalized = normalizeUsername(username);
  const entries = await loadBlacklist();
  await setInStorage(
    STORAGE_KEYS.blacklist,
    entries.filter((entry) => entry.username !== normalized)
  );
}
