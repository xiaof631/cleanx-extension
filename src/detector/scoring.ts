import type { AccountInfo, ContentInfo, DetectionReason } from "../shared/types";
import {
  bioKeywordRules,
  displayNameRules,
  suspiciousLinkPatterns,
  textKeywordRules,
  usernameRules,
  type RuleDefinition
} from "./rules";

const emojiPattern = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
const urlPattern = /https?:\/\/\S+/gi;

export function calculateScore(account: AccountInfo, content: ContentInfo): {
  score: number;
  reasons: DetectionReason[];
} {
  const reasons: DetectionReason[] = [];

  applyTextRules(account.username, usernameRules, reasons);
  applyTextRules(account.displayName ?? "", displayNameRules, reasons);
  applyTextRules(account.bio ?? "", bioKeywordRules, reasons);
  applyTextRules(content.text ?? "", textKeywordRules, reasons);
  applyLinkScore([account.externalUrl, content.url, content.text].filter(Boolean).join(" "), reasons);
  applyEmojiScore(content.text ?? "", reasons);
  applyRepetitionScore(content.text ?? "", reasons);

  const score = Math.min(
    100,
    reasons.reduce((total, reason) => total + reason.score, 0)
  );

  return { score, reasons };
}

function applyTextRules(value: string, rules: RuleDefinition[], reasons: DetectionReason[]) {
  const normalized = value.toLowerCase();
  if (!normalized) return;

  for (const rule of rules) {
    const keywordHit = rule.keywords?.some((keyword) => normalized.includes(keyword.toLowerCase()));
    const patternHit = rule.patterns?.some((pattern) => pattern.test(value));
    if (!keywordHit && !patternHit) continue;

    reasons.push({
      ruleId: rule.id,
      label: rule.label,
      score: rule.score
    });
  }
}

function applyLinkScore(value: string, reasons: DetectionReason[]) {
  const urls = value.match(urlPattern) ?? [];
  if (urls.length >= 2) {
    reasons.push({
      ruleId: "multiple_external_links",
      label: "外链数量异常",
      score: 20
    });
  }

  if (suspiciousLinkPatterns.some((pattern) => pattern.test(value))) {
    reasons.push({
      ruleId: "suspicious_external_link",
      label: "外链疑似跳转或聚合页",
      score: 25
    });
  }
}

function applyEmojiScore(text: string, reasons: DetectionReason[]) {
  if (text.length < 12) return;
  const emojiCount = Array.from(text.matchAll(emojiPattern)).length;
  const density = emojiCount / Array.from(text).length;
  if (density < 0.25) return;

  reasons.push({
    ruleId: "emoji_density_high",
    label: "emoji 密度较高",
    score: 15
  });
}

function applyRepetitionScore(text: string, reasons: DetectionReason[]) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length < 24) return;

  const chunks = normalized.match(/.{1,12}/g) ?? [];
  const uniqueChunks = new Set(chunks);
  if (chunks.length >= 4 && uniqueChunks.size / chunks.length <= 0.55) {
    reasons.push({
      ruleId: "repeated_comment",
      label: "文案重复度较高",
      score: 20
    });
  }
}
