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

test("flags decorative-symbol bait comments with short random usernames", () => {
  const samples = [
    scoreText("ircxm84305", "禅~心宽一💰寸路宽余生半生🌞｡(", "Ircxm"),
    scoreText("beavki66702", "౨ৎ 随心而安不负人间🖌温柔｡(", "Beavki"),
    scoreText("gdtfo146083", "༄∞(坐)🎁✈心无波澜静看世事🌈变迁♪", "Gdtfo"),
    scoreText("herqipkg30491", "༄🌈🕊️闲🔥烟煴火静待岁月安然༄｡(", "Herqipkg"),
    scoreText("dfkumx5573", "∞༄心归托得便是👍人间🍆自在｡✿", "Dfkumx")
  ];

  for (const result of samples) {
    assert.ok(result.score >= getThresholds("standard").hide);
    assert.ok(result.reasons.some((reason) => reason.ruleId === "username_random_suffix"));
    assert.ok(result.reasons.some((reason) => reason.ruleId === "text_emotional_bait"));
    assert.ok(result.reasons.some((reason) => reason.ruleId === "decorative_bait_short_text"));
  }
});

test("does not flag normal short comments without bait signals", () => {
  const result = scoreText("techwriter", "今天下班了，准备去跑步");

  assert.equal(result.score, 0);
  assert.deepEqual(result.reasons, []);
});

test("does not hide ordinary decorative phrasing from a non-batch identity", () => {
  const result = scoreText("alice", "今天也觉得人间温柔ღ", "Alice Chen");

  assert.ok(result.score < getThresholds("standard").hide);
  assert.ok(!result.reasons.some((reason) => reason.ruleId === "decorative_bait_short_text"));
});

test("short code alone stays below the hide threshold", () => {
  const result = scoreText("brandnews", "新品A12今天发布😄");

  assert.ok(result.score < getThresholds("standard").hide);
  assert.ok(result.reasons.some((reason) => reason.ruleId === "short_code_in_short_text"));
  assert.ok(!result.reasons.some((reason) => reason.ruleId === "bait_signal_combination"));
});
