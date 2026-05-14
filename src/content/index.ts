import type { BatchBlockRequest, BatchBlockResponse } from "../shared/types";
import { isExtensionContextInvalidated, loadSettings } from "../storage";
import { blockUsernamesOnCurrentPage } from "./block";
import { restoreCleanXNodes } from "./renderer";
import { scanExistingNodes, startObserve, watchStorageChanges } from "./scanner";

declare global {
  interface Window {
    __cleanxContentRuntimeVersion?: string;
  }
}

const CONTENT_RUNTIME_VERSION = "2026-05-13-decorative-bait-v2";

async function bootstrap() {
  const settings = await loadSettings();
  watchStorageChanges();

  if (!settings.enabled) {
    restoreCleanXNodes();
    return;
  }

  if (settings.pauseUntil && Date.now() < new Date(settings.pauseUntil).getTime()) {
    return;
  }

  scanExistingNodes();
  startObserve();
}

function registerMessageHandlers() {
  if (!chrome.runtime?.onMessage) return;

  chrome.runtime.onMessage.addListener((message: BatchBlockRequest, _sender, sendResponse) => {
    if (message?.type !== "cleanx:block-usernames") return false;

    void blockUsernamesOnCurrentPage(message.usernames)
      .then((result) => {
        sendResponse(result satisfies BatchBlockResponse);
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          results: [
            {
              username: "",
              status: "failed",
              message: error instanceof Error ? error.message : "批量 Block 失败"
            }
          ]
        } satisfies BatchBlockResponse);
      });

    return true;
  });
}

if (window.__cleanxContentRuntimeVersion !== CONTENT_RUNTIME_VERSION) {
  window.__cleanxContentRuntimeVersion = CONTENT_RUNTIME_VERSION;
  registerMessageHandlers();
  void bootstrap().catch((error) => {
    if (isExtensionContextInvalidated(error)) return;
    console.error("[CleanX] bootstrap failed", error);
  });
}
