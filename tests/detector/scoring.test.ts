import assert from "node:assert/strict";
import test from "node:test";

import { calculateScore } from "../../src/detector/scoring";
import { getThresholds } from "../../src/detector/thresholds";
import type { AccountInfo, ContentInfo } from "../../src/shared/types";

function scoreText(username: string, text: string, displayName?: string) {
  const account: AccountInfo = {
    username,
    displayName
  };
  const content: ContentInfo = {
    type: "comment",
    text,
    source: "comment"
  };

  return calculateScore(account, content);
}

test("flags screenshot-style bait comments with multiple signals", () => {
  const result = scoreText("lina_de4126", "小狗求抱抱😮😉f32😮", "千叶芊");

  assert.ok(result.score >= getThresholds("standard").hide);
  assert.ok(result.reasons.some((reason) => reason.ruleId === "username_random_suffix"));
  assert.ok(result.reasons.some((reason) => reason.ruleId === "text_emotional_bait"));
  assert.ok(result.reasons.some((reason) => reason.ruleId === "short_code_in_short_text"));
  assert.ok(result.reasons.some((reason) => reason.ruleId === "bait_signal_combination"));
});

test("still scores high when emoji extraction is missing but bait phrase, code and batch username remain", () => {
  const result = scoreText("ekrems45099", "小狗求抱抱b64", "韵琳学姐");

  assert.ok(result.score >= getThresholds("standard").hide);
  assert.ok(result.reasons.some((reason) => reason.ruleId === "username_random_suffix"));
  assert.ok(result.reasons.some((reason) => reason.ruleId === "text_emotional_bait"));
  assert.ok(result.reasons.some((reason) => reason.ruleId === "short_code_in_short_text"));
  assert.ok(result.reasons.some((reason) => reason.ruleId === "bait_signal_combination"));
});

test("does not flag normal short comments without bait signals", () => {
  const result = scoreText("techwriter", "今天下班了，准备去跑步");

  assert.equal(result.score, 0);
  assert.deepEqual(result.reasons, []);
});

test("short code alone stays below the hide threshold", () => {
  const result = scoreText("brandnews", "新品A12今天发布😄");

  assert.ok(result.score < getThresholds("standard").hide);
  assert.ok(result.reasons.some((reason) => reason.ruleId === "short_code_in_short_text"));
  assert.ok(!result.reasons.some((reason) => reason.ruleId === "bait_signal_combination"));
});
