import { detect } from "../detector";
import { hasChromeStorageChangeListener, ignoreExtensionContextInvalidated, loadSettings } from "../storage";
import { recordDetection } from "../storage/detectionLog";
import { incrementScannedAccountCount } from "../storage/stats";
import { PROCESSED_ATTR, PROCESSED_VERSION, STORAGE_KEYS } from "../shared/constants";
import type { Settings } from "../shared/types";
import { extractContentNode } from "./extractor";
import { applyAction, restoreCleanXNodes } from "./renderer";
import { findContentNodes } from "./selectors";

const recoveredUsernames = new Set<string>();
const pendingNodes = new Set<Element>();
let observer: MutationObserver | undefined;
let flushTimer: number | undefined;
let settingsCache: Settings | undefined;

export async function processContentNode(node: Element) {
  if (node.getAttribute(PROCESSED_ATTR) === PROCESSED_VERSION) return;
  node.setAttribute(PROCESSED_ATTR, PROCESSED_VERSION);

  const settings = settingsCache ?? (await loadSettings());
  settingsCache = settings;

  const payload = extractContentNode(node);
  if (!payload) return;

  await incrementScannedAccountCount(payload.account.username);
  const result = await detect(payload.account, payload.content, {
    settings,
    recoveredUsernames
  });
  await recordDetection(payload, result);

  applyAction(node, payload, result, settings, {
    onRestore(username) {
      recoveredUsernames.add(username);
    }
  });
}

export function scanExistingNodes() {
  enqueueNodes(findContentNodes());
}

export function startObserve() {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    const nodes: Element[] = [];
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches("article")) nodes.push(node);
        nodes.push(...findContentNodes(node));
      });
    }
    enqueueNodes(nodes);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

export function watchStorageChanges() {
  if (!hasChromeStorageChangeListener()) return;

  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      const relevantKeys = [
        STORAGE_KEYS.settings,
        STORAGE_KEYS.blacklist,
        STORAGE_KEYS.whitelist
      ] as string[];
      if (!relevantKeys.some((key) => key in changes)) return;

      void loadSettings()
        .then((settings) => {
          settingsCache = settings;
          restoreCleanXNodes();
          clearProcessedMarks();
          if (settings.enabled) scanExistingNodes();
        })
        .catch(ignoreExtensionContextInvalidated);
    });
  } catch (error) {
    ignoreExtensionContextInvalidated(error);
  }
}

function enqueueNodes(nodes: Element[]) {
  for (const node of nodes) pendingNodes.add(node);
  if (flushTimer) return;

  flushTimer = window.setTimeout(() => {
    const batch = Array.from(pendingNodes);
    pendingNodes.clear();
    flushTimer = undefined;
    batch.forEach((node) => {
      void processContentNode(node).catch(ignoreExtensionContextInvalidated);
    });
  }, 120);
}

function clearProcessedMarks() {
  document.querySelectorAll(`[${PROCESSED_ATTR}]`).forEach((node) => {
    node.removeAttribute(PROCESSED_ATTR);
  });
}
