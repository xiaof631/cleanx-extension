import { addToBlacklist } from "../storage/blacklist";
import { normalizeUsername } from "../storage";
import type { BatchBlockResponse, ExtractedPayload } from "../shared/types";

const MENU_OPEN_TIMEOUT_MS = 2500;
const DIALOG_OPEN_TIMEOUT_MS = 2500;
const POLL_INTERVAL_MS = 120;
const BATCH_BLOCK_DELAY_MS = 450;
const AUTO_SCROLL_ATTEMPTS = 4;
const AUTO_SCROLL_STEP_PX = 1200;
const AUTO_SCROLL_SETTLE_MS = 900;
const BLOCK_KEYWORDS = ["block", "封锁", "封鎖", "屏蔽"];
const UNBLOCK_KEYWORDS = ["unblock", "解除封锁", "解除封鎖", "取消屏蔽"];
const MORE_BUTTON_SELECTORS = [
  '[data-testid="caret"]',
  'button[aria-label*="More"]',
  'button[aria-label*="更多"]',
  'button[aria-label*="更多選項"]',
  'button[aria-haspopup="menu"]'
];

export async function blockAccountOnX(node: Element, payload: ExtractedPayload): Promise<void> {
  const cleanup = temporarilyRevealNode(node);

  try {
    const menuButton = findMenuButton(node);
    if (!menuButton) {
      throw new Error("未找到该内容的更多菜单按钮");
    }

    menuButton.click();

    const blockMenuItem = await waitFor(() => findBlockMenuItem(payload.account.username), MENU_OPEN_TIMEOUT_MS);
    if (!blockMenuItem) {
      throw new Error("未找到 X 的 Block 菜单项");
    }

    blockMenuItem.click();

    const confirmButton = await waitFor(() => findBlockConfirmButton(payload.account.username), DIALOG_OPEN_TIMEOUT_MS);
    if (!confirmButton) {
      throw new Error("未找到 X 的 Block 确认按钮");
    }

    confirmButton.click();
    await addToBlacklist(payload.account, payload.content.source, "manual");
  } finally {
    cleanup();
  }
}

export async function blockUsernamesOnCurrentPage(usernames: string[]): Promise<BatchBlockResponse> {
  const deduped = Array.from(new Set(usernames.map(normalizeUsername).filter(Boolean)));
  const results: BatchBlockResponse["results"] = [];

  for (const username of deduped) {
    const node = await findOrLoadContentNodeByUsername(username);
    if (!node) {
      results.push({
        username,
        status: "not_found",
        message: `当前页面未找到该账号，已自动滚动查找 ${AUTO_SCROLL_ATTEMPTS} 轮`
      });
      continue;
    }

    const payload = extractPayloadForBlock(node, username);
    if (!payload) {
      results.push({
        username,
        status: "failed",
        message: "当前页面无法提取该账号信息"
      });
      continue;
    }

    try {
      await blockAccountOnX(node, payload);
      results.push({
        username,
        status: "blocked"
      });
    } catch (error) {
      results.push({
        username,
        status: "failed",
        message: error instanceof Error ? error.message : "Block 失败"
      });
    }

    await delay(BATCH_BLOCK_DELAY_MS);
  }

  return {
    ok: results.every((result) => result.status === "blocked"),
    results
  };
}

function temporarilyRevealNode(node: Element) {
  const htmlNode = node as HTMLElement;
  const previousDisplay = htmlNode.style.display;
  const hadHiddenClass = htmlNode.classList.contains("cleanx-hidden-node");

  if (hadHiddenClass) {
    htmlNode.classList.remove("cleanx-hidden-node");
    htmlNode.style.display = "";
  }

  return () => {
    if (!hadHiddenClass) return;
    htmlNode.classList.add("cleanx-hidden-node");
    htmlNode.style.display = previousDisplay;
  };
}

function findMenuButton(node: Element): HTMLElement | null {
  for (const selector of MORE_BUTTON_SELECTORS) {
    const candidate = node.querySelector<HTMLElement>(selector);
    if (candidate) return candidate;
  }

  return null;
}

function findContentNodeByUsername(username: string): Element | null {
  return (
    Array.from(document.querySelectorAll("article")).find((node) => {
      const payload = extractPayloadForBlock(node, username);
      return payload && normalizeUsername(payload.account.username) === username;
    }) ?? null
  );
}

async function findOrLoadContentNodeByUsername(username: string): Promise<Element | null> {
  let node = findContentNodeByUsername(username);
  if (node) return node;

  let previousArticleCount = document.querySelectorAll("article").length;
  let previousScrollTop = getScrollTop();

  for (let attempt = 0; attempt < AUTO_SCROLL_ATTEMPTS; attempt += 1) {
    await scrollForMoreContent();
    node = findContentNodeByUsername(username);
    if (node) return node;

    const articleCount = document.querySelectorAll("article").length;
    const scrollTop = getScrollTop();
    const progressed = articleCount > previousArticleCount || scrollTop > previousScrollTop;
    previousArticleCount = articleCount;
    previousScrollTop = scrollTop;

    if (!progressed) break;
  }

  return null;
}

function extractPayloadForBlock(node: Element, username: string): ExtractedPayload | null {
  const usernameBlock = node.querySelector('[data-testid="User-Name"]') ?? node;
  const visibleHandle = Array.from(usernameBlock.querySelectorAll("span"))
    .map((span) => span.textContent?.trim() ?? "")
    .find((text) => text.startsWith("@") && normalizeUsername(text) === username);

  if (!visibleHandle) {
    const hrefMatched = Array.from(usernameBlock.querySelectorAll<HTMLAnchorElement>("a[href]")).some((link) => {
      try {
        const handle = new URL(link.href, location.origin).pathname.split("/")[1] ?? "";
        return normalizeUsername(handle) === username;
      } catch {
        return false;
      }
    });
    if (!hrefMatched) return null;
  }

  const displayName = Array.from(usernameBlock.querySelectorAll("span"))
    .map((span) => span.textContent?.trim() ?? "")
    .filter(Boolean)
    .find((text) => !text.startsWith("@") && normalizeUsername(text) !== username);

  const text = Array.from(node.querySelectorAll('[data-testid="tweetText"]'))
    .map((element) => element.textContent?.trim() ?? "")
    .filter(Boolean)
    .join("\n");

  return {
    account: {
      username,
      displayName
    },
    content: {
      type: "comment",
      text: text || node.textContent?.trim().replace(/\s+/g, " ") || "",
      source: "comment"
    }
  };
}

function findBlockMenuItem(username: string): HTMLElement | null {
  const normalizedUsername = username.replace(/^@/, "").toLowerCase();
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('[role="menuitem"], [data-testid="Dropdown"] [tabindex="0"]')
  );

  return findMatchingAction(candidates, normalizedUsername);
}

function findBlockConfirmButton(username: string): HTMLElement | null {
  const normalizedUsername = username.replace(/^@/, "").toLowerCase();
  const dialog = document.querySelector('[role="dialog"]') ?? document.body;
  const candidates = Array.from(dialog.querySelectorAll<HTMLElement>('button, [role="button"]'));

  return findMatchingAction(candidates, normalizedUsername);
}

function containsBlockKeyword(value: string) {
  return BLOCK_KEYWORDS.some((keyword) => value.includes(keyword));
}

function containsUnblockKeyword(value: string) {
  return UNBLOCK_KEYWORDS.some((keyword) => value.includes(keyword));
}

function findMatchingAction(candidates: HTMLElement[], normalizedUsername: string) {
  const filtered = candidates.filter((candidate) => {
    const text = normalizeText(candidate.textContent);
    return Boolean(text) && containsBlockKeyword(text) && !containsUnblockKeyword(text);
  });

  return (
    filtered.find((candidate) => normalizeText(candidate.textContent).includes(normalizedUsername)) ??
    filtered[0] ??
    null
  );
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

async function waitFor<T>(factory: () => T | null | undefined, timeoutMs: number): Promise<T | null> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const value = factory();
    if (value) return value;
    await delay(POLL_INTERVAL_MS);
  }

  return null;
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function scrollForMoreContent() {
  const scroller = getScrollContainer();
  const startTop = scroller.scrollTop;

  const lastArticle = document.querySelector("article:last-of-type");
  if (lastArticle instanceof HTMLElement) {
    lastArticle.scrollIntoView({ block: "end", behavior: "auto" });
  }

  scroller.scrollBy?.({ top: AUTO_SCROLL_STEP_PX, left: 0, behavior: "auto" });
  if (scroller.scrollTop === startTop) {
    scroller.scrollTop = startTop + AUTO_SCROLL_STEP_PX;
  }

  await delay(AUTO_SCROLL_SETTLE_MS);
}

function getScrollContainer(): HTMLElement {
  const scrollingElement = document.scrollingElement;
  if (scrollingElement instanceof HTMLElement) return scrollingElement;
  return document.documentElement;
}

function getScrollTop() {
  return getScrollContainer().scrollTop;
}
