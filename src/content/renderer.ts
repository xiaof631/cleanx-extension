import { normalizeUsername } from "../storage";
import { addToWhitelist } from "../storage/whitelist";
import { incrementHiddenCount, incrementRestoreCount } from "../storage/stats";
import { HIDDEN_ATTR } from "../shared/constants";
import type { DetectionResult, ExtractedPayload, Settings } from "../shared/types";

interface RendererOptions {
  onRestore: (username: string) => void;
}

export function applyAction(
  node: Element,
  payload: ExtractedPayload,
  result: DetectionResult,
  settings: Settings,
  options: RendererOptions
) {
  if (result.action === "show") return;

  if (result.action === "collapse" || settings.hiddenMode === "collapse") {
    node.classList.add("cleanx-collapsed");
    return;
  }

  if (settings.hiddenMode === "blur") {
    node.classList.add("cleanx-blurred");
    return;
  }

  hideWithPlaceholder(node, payload, result, options);
}

export function restoreCleanXNodes() {
  document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`).forEach((node) => {
    node.classList.remove("cleanx-hidden-node", "cleanx-collapsed", "cleanx-blurred");
    node.removeAttribute(HIDDEN_ATTR);
  });

  document.querySelectorAll(".cleanx-placeholder").forEach((placeholder) => placeholder.remove());
}

function hideWithPlaceholder(
  node: Element,
  payload: ExtractedPayload,
  result: DetectionResult,
  options: RendererOptions
) {
  if (node.getAttribute(HIDDEN_ATTR) === "true") return;

  const placeholder = document.createElement("div");
  const username = normalizeUsername(payload.account.username);
  placeholder.className = "cleanx-placeholder";
  placeholder.dataset.cleanxUsername = username;

  const reasons = result.reasons.length
    ? result.reasons
    : [{ ruleId: "unknown", label: "命中本地规则", score: result.score }];

  placeholder.innerHTML = `
    <div class="cleanx-placeholder__row">
      <span class="cleanx-placeholder__title">已隐藏疑似低质账号内容</span>
      <button type="button" data-cleanx-action="restore">恢复</button>
      <button type="button" data-cleanx-action="whitelist">加入白名单</button>
      <button type="button" data-cleanx-action="detail">详情</button>
    </div>
    <div class="cleanx-placeholder__details" hidden>
      <div>风险分：${result.score}</div>
      <ul>
        ${reasons.map((reason) => `<li>${escapeHtml(reason.label)} +${reason.score}</li>`).join("")}
      </ul>
    </div>
  `;

  node.before(placeholder);
  node.classList.add("cleanx-hidden-node");
  node.setAttribute(HIDDEN_ATTR, "true");
  void incrementHiddenCount();

  placeholder.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.cleanxAction;
    if (!action) return;

    if (action === "restore") {
      restoreNode(node, placeholder, username, options);
      return;
    }

    if (action === "whitelist") {
      void addToWhitelist(payload.account, payload.content.source).then(() => {
        restoreNode(node, placeholder, username, options);
      });
      return;
    }

    if (action === "detail") {
      const details = placeholder.querySelector<HTMLElement>(".cleanx-placeholder__details");
      if (details) details.hidden = !details.hidden;
    }
  });
}

function restoreNode(
  node: Element,
  placeholder: HTMLElement,
  username: string,
  options: RendererOptions
) {
  node.classList.remove("cleanx-hidden-node", "cleanx-collapsed", "cleanx-blurred");
  node.removeAttribute(HIDDEN_ATTR);
  placeholder.remove();
  options.onRestore(username);
  void incrementRestoreCount();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
