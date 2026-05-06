const reservedPaths = new Set([
  "home",
  "explore",
  "notifications",
  "messages",
  "i",
  "search",
  "settings",
  "compose",
  "intent",
  "hashtag"
]);

export function findContentNodes(root: ParentNode = document): Element[] {
  return Array.from(root.querySelectorAll("article"));
}

export function isCandidateHandle(value: string): boolean {
  const handle = value.replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return false;
  return !reservedPaths.has(handle.toLowerCase());
}

export function extractHandleFromHref(href: string): string | undefined {
  try {
    const url = new URL(href, location.origin);
    const [, firstSegment] = url.pathname.split("/");
    if (!firstSegment || !isCandidateHandle(firstSegment)) return undefined;
    return firstSegment;
  } catch {
    return undefined;
  }
}
