import { normalizeUsername } from "../storage";
import { isBlacklisted } from "../storage/blacklist";
import { isWhitelisted } from "../storage/whitelist";
import type { AccountInfo, ContentInfo, DetectionResult, Settings } from "../shared/types";
import { calculateScore } from "./scoring";
import { getThresholds } from "./thresholds";

interface DetectOptions {
  settings: Settings;
  recoveredUsernames: Set<string>;
}

export async function detect(
  account: AccountInfo,
  content: ContentInfo,
  options: DetectOptions
): Promise<DetectionResult> {
  const username = normalizeUsername(account.username);

  if (!options.settings.enabled) {
    return { score: 0, action: "show", reasons: [] };
  }

  if (options.settings.pauseUntil && Date.now() < new Date(options.settings.pauseUntil).getTime()) {
    return { score: 0, action: "show", reasons: [] };
  }

  if (await isWhitelisted(username)) {
    return { score: 0, action: "show", reasons: [] };
  }

  if (await isBlacklisted(username)) {
    return {
      score: 100,
      action: "hide",
      reasons: [{ ruleId: "blacklist", label: "本地黑名单", score: 100 }]
    };
  }

  if (options.recoveredUsernames.has(username)) {
    return { score: 0, action: "show", reasons: [] };
  }

  const { score, reasons } = calculateScore(account, content);
  const thresholds = getThresholds(options.settings.level);

  if (score >= thresholds.hide) return { score, action: "hide", reasons };
  if (score >= thresholds.collapse) return { score, action: "collapse", reasons };
  return { score, action: "show", reasons };
}
