import type { ContentSource, ExtractedPayload } from "../shared/types";
import { extractHandleFromHref, isCandidateHandle } from "./selectors";

export function extractContentNode(node: Element): ExtractedPayload | null {
  const usernameBlock = node.querySelector('[data-testid="User-Name"]') ?? node;
  const username = extractUsername(usernameBlock);
  if (!username) return null;

  const displayName = extractDisplayName(usernameBlock, username);
  const text = extractText(node);
  const statusUrl = extractStatusUrl(node);
  const source = inferSource();

  return {
    account: {
      username,
      displayName,
      profileUrl: `https://x.com/${username}`
    },
    content: {
      id: statusUrl?.split("/status/")[1]?.split(/[/?#]/)[0],
      type: source === "search" ? "search" : source === "comment" ? "comment" : "tweet",
      text,
      url: statusUrl,
      source
    }
  };
}

function extractUsername(root: Element): string | undefined {
  const visibleHandle = Array.from(root.querySelectorAll("span"))
    .map((span) => span.textContent?.trim() ?? "")
    .find((text) => text.startsWith("@") && isCandidateHandle(text));

  if (visibleHandle) return visibleHandle.replace(/^@/, "");

  const hrefHandle = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .map((link) => extractHandleFromHref(link.href))
    .find(Boolean);

  return hrefHandle;
}

function extractDisplayName(root: Element, username: string): string | undefined {
  const spans = Array.from(root.querySelectorAll("span"))
    .map((span) => span.textContent?.trim() ?? "")
    .filter(Boolean);

  return spans.find((text) => !text.startsWith("@") && text.toLowerCase() !== username.toLowerCase());
}

function extractText(node: Element): string {
  const tweetText = Array.from(node.querySelectorAll('[data-testid="tweetText"]'))
    .map((element) => element.textContent?.trim() ?? "")
    .filter(Boolean)
    .join("\n");

  if (tweetText) return tweetText;
  return node.textContent?.trim().replace(/\s+/g, " ") ?? "";
}

function extractStatusUrl(node: Element): string | undefined {
  const statusLink = Array.from(node.querySelectorAll<HTMLAnchorElement>('a[href*="/status/"]')).find(
    (link) => /\/[^/]+\/status\/\d+/.test(new URL(link.href, location.origin).pathname)
  );

  return statusLink?.href;
}

function inferSource(): ContentSource {
  const path = location.pathname;
  if (path.startsWith("/search")) return "search";
  if (/\/status\/\d+/.test(path)) return "comment";
  if (path.startsWith("/i/")) return "profile";
  return "timeline";
}
