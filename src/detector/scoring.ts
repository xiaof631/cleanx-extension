import type { AccountInfo, ContentInfo, DetectionReason } from "../shared/types";
import {
  bioKeywordRules,
  displayNameRules,
  randomSuffixPatterns,
  suspiciousLinkPatterns,
  textKeywordRules,
  usernameRules,
  type RuleDefinition
} from "./rules";

const emojiPattern = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
const emojiRunPattern = /(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?\s*){2,}/gu;
const urlPattern = /https?:\/\/\S+/gi;
const shortCodePattern = /[a-z]\d{2,3}/i;
const emotionalBaitPattern =
  /(?:求抱抱|会疼人的?(?:哥哥|姐姐)|线下的?(?:哥哥|姐姐)|想找.{0,8}(?:哥哥|姐姐|对象)|dd个线下.{0,6}(?:哥哥|姐姐|对象)?|(?:小狗|猫咪).{0,4}求抱抱|求(?:收留|带走))/iu;

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
  applyShortCodeScore(content.text ?? "", reasons);
  applyEmojiBaitScore(content.text ?? "", reasons);
  applyBaitCombinationScore(account, content.text ?? "", reasons);
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
  const normalized = text.trim().replace(/\s+/g, "");
  const charCount = Array.from(normalized).length;
  if (charCount < 8) return;

  const emojiCount = Array.from(normalized.matchAll(emojiPattern)).length;
  const density = emojiCount / charCount;
  if (density < 0.22 && !(charCount <= 20 && emojiCount >= 3 && density >= 0.16)) return;

  reasons.push({
    ruleId: "emoji_density_high",
    label: "emoji 密度较高",
    score: 15
  });
}

function applyShortCodeScore(text: string, reasons: DetectionReason[]) {
  const normalized = text.trim().replace(/\s+/g, "");
  const charCount = Array.from(normalized).length;
  if (charCount === 0 || charCount > 24) return;
  if (!/[\u4e00-\u9fff]/u.test(normalized)) return;
  if (!shortCodePattern.test(normalized)) return;

  reasons.push({
    ruleId: "short_code_in_short_text",
    label: "短文本含异常编号",
    score: 22
  });
}

function applyEmojiBaitScore(text: string, reasons: DetectionReason[]) {
  const normalized = text.trim().replace(/\s+/g, "");
  const charCount = Array.from(normalized).length;
  if (charCount === 0 || charCount > 24) return;

  const emojiCount = Array.from(normalized.matchAll(emojiPattern)).length;
  if (emojiCount < 3) return;

  const emojiRuns = Array.from(normalized.matchAll(emojiRunPattern));
  const hasEmojiRun = emojiRuns.length > 0;
  const hasShortCode = shortCodePattern.test(normalized);
  if (!hasEmojiRun || !hasShortCode) return;

  reasons.push({
    ruleId: "emoji_bait_short_code",
    label: "短文本含连续表情与编号",
    score: 35
  });
}

function applyBaitCombinationScore(account: AccountInfo, text: string, reasons: DetectionReason[]) {
  const normalized = text.trim().replace(/\s+/g, "");
  const charCount = Array.from(normalized).length;
  if (charCount === 0 || charCount > 30) return;
  if (!/[\u4e00-\u9fff]/u.test(normalized)) return;

  const hasBaitPhrase = emotionalBaitPattern.test(normalized);
  const hasShortCode = shortCodePattern.test(normalized);
  const emojiCount = Array.from(normalized.matchAll(emojiPattern)).length;
  const hasEmojiRun = Array.from(normalized.matchAll(emojiRunPattern)).length > 0;
  const hasRandomSuffix = randomSuffixPatterns.some((pattern) => pattern.test(account.username));

  const signalCount = [hasBaitPhrase, hasShortCode, hasEmojiRun || emojiCount >= 3, hasRandomSuffix].filter(
    Boolean
  ).length;

  if (signalCount < 3 || !hasBaitPhrase) return;

  reasons.push({
    ruleId: "bait_signal_combination",
    label: "短文本命中多项引流特征",
    score: 28
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
