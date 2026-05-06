import { STORAGE_KEYS } from "../shared/constants";
import type { AccountInfo, ContentSource, ListEntry } from "../shared/types";
import { getFromStorage, normalizeEntries, normalizeUsername, setInStorage } from "./index";

export async function loadWhitelist(): Promise<ListEntry[]> {
  const entries = await getFromStorage<ListEntry[]>(STORAGE_KEYS.whitelist, []);
  return normalizeEntries(entries);
}

export async function isWhitelisted(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const entries = await loadWhitelist();
  return entries.some((entry) => entry.username === normalized);
}

export async function addToWhitelist(
  account: AccountInfo,
  source: ContentSource,
  reason: ListEntry["reason"] = "manual"
): Promise<void> {
  const entries = await loadWhitelist();
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

  await setInStorage(STORAGE_KEYS.whitelist, entries);
}

export async function removeFromWhitelist(username: string): Promise<void> {
  const normalized = normalizeUsername(username);
  const entries = await loadWhitelist();
  await setInStorage(
    STORAGE_KEYS.whitelist,
    entries.filter((entry) => entry.username !== normalized)
  );
}
