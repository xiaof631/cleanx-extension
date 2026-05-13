# X 清净助手 PRD 与技术实现文档

> 面向 Codex / Cursor / 开发同事的可执行产品与技术方案。  
> 版本：V0.1  
> 日期：2026-05-05  
> 项目暂定名：X 清净助手 / CleanX

---

## 0. 文档目标

本文档用于指导开发一个浏览器插件，帮助用户在 X 网页端自动隐藏低质账号内容，重点解决信息流和评论区中常见的垃圾营销、重复评论、成人导流、异常外链等问题。

第一版坚持一个原则：

> 只做本地识别与本地隐藏，不自动批量拉黑，不调用非公开接口，不上传用户浏览数据。用户显式点击后，可通过页面 UI 自动化执行单个账号 Block。

---

## 1. 产品概述

### 1.1 产品名称

中文名暂定：**X 清净助手**  
英文名候选：**CleanX / QuietX / X Feed Shield**

### 1.2 产品定位

一款面向 X 网页端的浏览器插件，自动识别并隐藏信息流、评论区、搜索结果中的低质账号内容，让用户的时间线更干净。

### 1.3 一句话介绍

> 自动净化 X 信息流，减少低质账号、垃圾营销、成人导流和重复评论干扰。

### 1.4 产品形态

首版：Chrome Extension Manifest V3。  
兼容目标：Chrome、Edge。  
后续可扩展：Firefox、Safari、远程规则订阅、Pro 版能力。

---

## 2. 背景与问题

### 2.1 用户痛点

1. X 信息流和评论区经常出现低质账号内容。
2. 手动拉黑或静音账号成本高，重复操作很烦。
3. X 自带静音词更偏关键词过滤，对账号画像识别不足。
4. 普通关键词屏蔽容易误伤，也容易被变体词、emoji、图片内容、外链绕过。
5. 用户真正想要的是“页面变干净”，而不是配置复杂规则。

### 2.2 现有同类产品不足

现有工具多集中在：

- 关键词过滤；
- 批量拉黑；
- 隐藏某些 UI 元素；
- 通用时间线清理。

但缺少一个专门面向低质账号识别、评论区净化、风险评分、本地黑白名单和误判恢复的轻量插件。

---

## 3. 产品目标与非目标

### 3.1 MVP 目标

第一版只验证一个核心体验：

> 用户打开 X 后，插件能够自动隐藏大部分低质账号内容，让首页时间线和评论区明显更干净。

### 3.2 关键指标

| 指标 | 说明 | 初始目标 |
|---|---|---|
| 开启率 | 安装后主动开启插件的用户比例 | 70%+ |
| 今日隐藏数 | 每日被插件隐藏的内容数量 | 能稳定统计 |
| 恢复率 | 被用户恢复的隐藏内容占比 | 越低越好，首版先观察 |
| 白名单添加数 | 判断误伤的重要信号 | 持续跟踪 |
| 插件性能 | 页面滚动时是否卡顿 | 无明显卡顿 |

### 3.3 非目标

第一版不做：

- 不自动批量拉黑；
- 不做无用户确认的自动模拟点击；
- 不破解 X 接口；
- 不默认上传用户浏览内容；
- 不做跨站跟踪；
- 不做移动端 App；
- 不做复杂云端 AI 分类。

---

## 4. 目标用户与核心场景

### 4.1 目标用户

| 用户类型 | 特征 | 需求 |
|---|---|---|
| 普通浏览用户 | 每天刷 X，不想被低质内容打扰 | 自动隐藏，无需配置 |
| 内容创作者 | 经常查看自己推文评论区 | 清理垃圾评论，降低运营成本 |
| 重度信息获取用户 | 用 X 获取 AI、科技、财经、产品信息 | 减少噪音，提高信息密度 |
| 开发者/产品经理 | 对工具效率敏感 | 可配置、可导入导出、可控 |

### 4.2 核心场景

#### 场景 A：首页时间线净化

用户打开 X 首页，插件自动扫描新增推文。若检测到疑似低质账号，自动隐藏并显示占位提示：

> 已隐藏疑似低质账号内容 · 恢复 · 加入白名单

#### 场景 B：评论区净化

用户点开热门推文，评论区中有大量重复或导流评论。插件自动隐藏高风险评论，正常评论优先展示。

#### 场景 C：搜索结果净化

用户搜索某个话题，插件隐藏搜索结果中的低质账号内容。

#### 场景 D：误判恢复

用户发现内容被误判，点击“恢复”。插件记录反馈，当前会话不再隐藏该账号，并可加入白名单。

#### 场景 E：手动加入黑名单

用户手动点击“加入本地黑名单”，后续该账号的推文、评论、推荐卡片都会自动隐藏。

---

## 5. MVP 功能需求

### 5.1 一键开启 / 关闭清净模式

用户可以在插件 popup 面板中控制状态：

- 开启；
- 关闭；
- 暂停 30 分钟；
- 仅当前页面生效。

**验收标准：**

1. 点击开关后，当前页面立即生效。
2. 关闭后不再隐藏任何内容。
3. 状态持久化保存。

### 5.2 自动识别低质账号

插件扫描以下对象：

- 首页推文作者；
- 评论区评论作者；
- 搜索结果账号；
- 推荐关注账号；
- 账号悬浮卡片。

第一版识别维度：

- 昵称特征；
- 用户名特征；
- 简介关键词；
- 外链特征；
- 推文/评论文本特征；
- 重复文案；
- emoji 密度；
- 用户反馈。

风险等级：

| 分数 | 等级 | 默认动作 |
|---:|---|---|
| 0-30 | 正常 | 正常展示 |
| 31-59 | 可疑 | 标准模式下正常，严格模式下折叠 |
| 60-79 | 高风险 | 自动隐藏 |
| 80-100 | 极高风险 | 自动隐藏，并进入待处理列表 |

### 5.3 自动隐藏与恢复

隐藏后不直接删除 DOM，而是替换为占位条，保证页面布局稳定。

占位条文案：

> 已隐藏疑似低质账号内容 · 恢复 · 加入白名单 · 详情

**验收标准：**

1. 被隐藏内容不影响 X 正常浏览。
2. 用户点击“恢复”后内容重新显示。
3. 恢复后的账号当前会话不再被隐藏。
4. 用户点击“加入白名单”后永久不再自动隐藏该账号。

### 5.4 本地黑名单

字段设计：

```json
{
  "userId": "optional",
  "username": "handle",
  "displayName": "昵称",
  "reason": "manual | rule | import",
  "createdAt": "ISO datetime",
  "source": "timeline | comment | search"
}
```

**验收标准：**

1. 黑名单保存在浏览器本地。
2. 刷新页面后继续生效。
3. 用户可以在设置页移除账号。
4. 支持导入/导出 JSON。

### 5.5 本地白名单

白名单优先级高于所有规则。

**验收标准：**

1. 白名单账号永不自动隐藏。
2. 用户可以手动添加和删除。
3. 从隐藏占位条可一键加入白名单。

### 5.6 过滤强度设置

| 模式 | 处理策略 |
|---|---|
| 轻度 | 只隐藏极高风险内容 |
| 标准 | 隐藏高风险内容，折叠中风险内容 |
| 严格 | 隐藏中高风险内容 |

默认使用：标准模式。

### 5.7 屏蔽统计

popup 面板展示今日净化效果：

- 今日已隐藏内容数量；
- 今日识别账号数量；
- 今日恢复次数；
- 黑名单账号数；
- 白名单账号数。

每日统计以本地日期为准，跨日自动重置。

---

## 6. 页面与交互设计

### 6.1 Popup 面板

结构建议：

```text
X 清净助手
当前状态：已开启

[ 开启 / 关闭 ]
[ 暂停 30 分钟 ]

今日已隐藏：128 条
疑似账号：36 个
恢复次数：4 次

过滤强度：
[ 轻度 ] [ 标准 ] [ 严格 ]

快捷操作：
[ 查看黑名单 ]
[ 查看白名单 ]
[ 导出配置 ]
[ 设置 ]
```

### 6.2 设置页

设置页分区：

- 基础设置；
- 规则强度；
- 隐藏方式；
- 黑名单管理；
- 白名单管理；
- 自定义关键词；
- 数据导入/导出；
- 隐私说明。

### 6.3 隐藏占位条

展示内容：

```text
已隐藏疑似低质账号内容
[恢复] [加入白名单] [详情]
```

点击“详情”展示简化原因：

```text
命中规则：
- 简介疑似导流
- 外链异常
- 文案重复度较高
风险分：78
```

注意：详情里不展示敏感原文，只展示规则原因。

---

## 7. 规则引擎设计

### 7.1 评分公式

```js
riskScore =
  usernameScore +
  displayNameScore +
  bioScore +
  linkScore +
  textScore +
  emojiScore +
  repeatScore +
  feedbackScore;
```

### 7.2 处理优先级

```text
白名单 > 黑名单 > 用户本次恢复 > 风险评分规则
```

### 7.3 处理逻辑伪代码

```js
function decideAction(account, content, settings) {
  if (isInWhitelist(account)) return "show";
  if (isRecoveredInSession(account)) return "show";
  if (isInBlacklist(account)) return "hide";

  const score = calculateRiskScore(account, content);
  const threshold = getThreshold(settings.level);

  if (score >= threshold.hide) return "hide";
  if (score >= threshold.collapse) return "collapse";
  return "show";
}
```

### 7.4 默认规则示例

```json
[
  {
    "id": "bio_lead_generation",
    "type": "bio_keyword",
    "keywords": ["看主页", "私信", "加我", "备用号"],
    "score": 30
  },
  {
    "id": "suspicious_external_link",
    "type": "profile_link",
    "patterns": ["short_link", "redirect_link", "unknown_domain"],
    "score": 25
  },
  {
    "id": "emoji_density_high",
    "type": "text_metric",
    "metric": "emoji_density",
    "threshold": 0.25,
    "score": 15
  },
  {
    "id": "repeated_comment",
    "type": "text_similarity",
    "threshold": 0.85,
    "score": 20
  }
]
```

### 7.5 默认阈值

| 模式 | 折叠阈值 | 隐藏阈值 |
|---|---:|---:|
| 轻度 | 80 | 85 |
| 标准 | 50 | 60 |
| 严格 | 35 | 45 |

---

## 8. 技术架构

### 8.1 技术栈

- Chrome Extension Manifest V3；
- TypeScript；
- Vite；
- 原生 DOM API；
- MutationObserver；
- chrome.storage.local；
- 可选：React 用于 popup/options 页面。

### 8.2 文件结构

```text
cleanx-extension/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── icons/
├── src/
│   ├── manifest.ts
│   ├── background/
│   │   └── index.ts
│   ├── content/
│   │   ├── index.ts
│   │   ├── scanner.ts
│   │   ├── extractor.ts
│   │   ├── renderer.ts
│   │   └── selectors.ts
│   ├── detector/
│   │   ├── index.ts
│   │   ├── rules.ts
│   │   ├── scoring.ts
│   │   └── thresholds.ts
│   ├── storage/
│   │   ├── index.ts
│   │   ├── blacklist.ts
│   │   ├── whitelist.ts
│   │   └── stats.ts
│   ├── popup/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── options/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── shared/
│       ├── types.ts
│       └── constants.ts
└── README.md
```

### 8.3 Manifest 权限

建议权限：

```json
{
  "manifest_version": 3,
  "name": "X 清净助手",
  "version": "0.1.0",
  "permissions": ["storage"],
  "host_permissions": ["https://x.com/*", "https://twitter.com/*"],
  "content_scripts": [
    {
      "matches": ["https://x.com/*", "https://twitter.com/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "options_page": "options.html",
  "background": {
    "service_worker": "background.js"
  }
}
```

---

## 9. 页面扫描与 DOM 策略

### 9.1 动态页面监听

X 是动态加载页面，需要使用 MutationObserver。

流程：

```text
监听 DOM 变化
找到新增推文/评论节点
判断是否已处理
提取账号信息
计算风险分
执行隐藏/折叠/展示
标记为已处理
```

伪代码：

```js
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const tweetNodes = collectTweetNodes(mutation.addedNodes);
    tweetNodes.forEach(processContentNode);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

### 9.2 Selector Adapter

不要强依赖单一 class。建议组合：

- data-testid；
- role；
- aria-label；
- href 结构；
- 相对 DOM 层级。

优先级：

```text
data-testid > role > href > DOM structure
```

### 9.3 节点处理状态

给已处理节点添加自定义属性：

```html
<article data-cleanx-processed="true"></article>
```

避免重复扫描与重复隐藏。

---

## 10. 核心数据模型

### 10.1 AccountInfo

```ts
export interface AccountInfo {
  userId?: string;
  username: string;
  displayName?: string;
  bio?: string;
  profileUrl?: string;
  externalUrl?: string;
}
```

### 10.2 ContentInfo

```ts
export interface ContentInfo {
  id?: string;
  type: "tweet" | "comment" | "search" | "profile_card";
  text?: string;
  url?: string;
  source: "timeline" | "comment" | "search" | "profile";
}
```

### 10.3 DetectionResult

```ts
export interface DetectionResult {
  score: number;
  action: "show" | "collapse" | "hide";
  reasons: DetectionReason[];
}

export interface DetectionReason {
  ruleId: string;
  label: string;
  score: number;
}
```

### 10.4 Settings

```ts
export interface Settings {
  enabled: boolean;
  level: "light" | "standard" | "strict";
  hiddenMode: "hide" | "collapse" | "blur";
  pauseUntil?: string;
  showPlaceholder: boolean;
}
```

---

## 11. 核心代码骨架

### 11.1 content/index.ts

```ts
import { scanExistingNodes, startObserve } from "./scanner";
import { loadSettings } from "../storage";

async function bootstrap() {
  const settings = await loadSettings();
  if (!settings.enabled) return;

  await scanExistingNodes();
  startObserve();
}

bootstrap().catch(console.error);
```

### 11.2 scanner.ts

```ts
import { extractContentNode } from "./extractor";
import { detect } from "../detector";
import { applyAction } from "./renderer";

const PROCESSED_ATTR = "data-cleanx-processed";

export async function processContentNode(node: Element) {
  if (node.getAttribute(PROCESSED_ATTR) === "true") return;
  node.setAttribute(PROCESSED_ATTR, "true");

  const payload = extractContentNode(node);
  if (!payload) return;

  const result = await detect(payload.account, payload.content);
  applyAction(node, payload, result);
}

export async function scanExistingNodes() {
  const nodes = document.querySelectorAll("article");
  nodes.forEach((node) => processContentNode(node));
}

export function startObserve() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches("article")) processContentNode(node);
        node.querySelectorAll?.("article").forEach(processContentNode);
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
```

### 11.3 detector/index.ts

```ts
import { calculateScore } from "./scoring";
import { getThresholds } from "./thresholds";
import { isBlacklisted, isWhitelisted } from "../storage";

export async function detect(account, content) {
  if (await isWhitelisted(account.username)) {
    return { score: 0, action: "show", reasons: [] };
  }

  if (await isBlacklisted(account.username)) {
    return {
      score: 100,
      action: "hide",
      reasons: [{ ruleId: "blacklist", label: "本地黑名单", score: 100 }]
    };
  }

  const { score, reasons } = calculateScore(account, content);
  const thresholds = await getThresholds();

  if (score >= thresholds.hide) return { score, action: "hide", reasons };
  if (score >= thresholds.collapse) return { score, action: "collapse", reasons };
  return { score, action: "show", reasons };
}
```

### 11.4 renderer.ts

```ts
export function applyAction(node, payload, result) {
  if (result.action === "show") return;

  if (result.action === "collapse") {
    node.classList.add("cleanx-collapsed");
    return;
  }

  const placeholder = document.createElement("div");
  placeholder.className = "cleanx-placeholder";
  placeholder.innerHTML = `
    <span>已隐藏疑似低质账号内容</span>
    <button data-action="restore">恢复</button>
    <button data-action="whitelist">加入白名单</button>
    <button data-action="detail">详情</button>
  `;

  node.replaceWith(placeholder);

  placeholder.querySelector('[data-action="restore"]')?.addEventListener("click", () => {
    placeholder.replaceWith(node);
  });
}
```

---

## 12. 隐私与合规边界

### 12.1 数据原则

第一版坚持：

- 所有判断默认在本地完成；
- 不上传用户时间线；
- 不上传用户浏览记录；
- 不采集用户完整账号关系；
- 不做跨站追踪；
- 导入导出由用户主动触发。

### 12.2 平台边界

第一版不做自动批量拉黑，不模拟用户连续点击，不调用非公开接口。  
如后续支持官方静音/拉黑能力，应通过官方授权接口，并且由用户明确确认。

### 12.3 上架文案建议

避免使用过于敏感或攻击性的定位。  
推荐表达：

- X 信息流净化工具；
- 低质账号屏蔽助手；
- 垃圾营销内容过滤器；
- 评论区清理工具。

不建议表达：

- 黄推屏蔽器；
- 成人账号清理器；
- 自动拉黑神器。

---

## 13. 测试与验收

### 13.1 功能验收

| 编号 | 测试项 | 预期结果 |
|---|---|---|
| T01 | 打开 x.com 首页 | 插件正常注入 |
| T02 | 开启/关闭插件 | 页面处理逻辑立即切换 |
| T03 | 滚动时间线 | 新加载内容继续被扫描 |
| T04 | 命中高风险规则 | 内容被隐藏并显示占位条 |
| T05 | 点击恢复 | 原内容重新显示 |
| T06 | 加入白名单 | 后续不再自动隐藏该账号 |
| T07 | 加入黑名单 | 后续自动隐藏该账号内容 |
| T08 | 刷新页面 | 配置和黑白名单保留 |
| T09 | 切换过滤强度 | 阈值生效 |
| T10 | 导出配置 | 可下载 JSON |

### 13.2 性能验收

- 单次 Mutation 扫描需要节流；
- 已处理节点不重复处理；
- 页面快速滚动时无明显卡顿；
- 不对整页频繁执行重型查询；
- 规则匹配应尽量使用预编译正则和 Set。

### 13.3 误判验收

- 所有隐藏都可恢复；
- 白名单优先级最高；
- 用户恢复次数应进入统计；
- 详情只展示规则原因，不展示敏感原文。

---

## 14. 开发排期建议

### Week 1：基础框架与页面扫描

- 创建 Chrome Extension MV3 项目；
- 完成 manifest 配置；
- 完成 content script 注入；
- 完成 MutationObserver；
- 完成基础节点识别。

### Week 2：规则引擎与隐藏能力

- 实现账号信息提取；
- 实现基础规则评分；
- 实现隐藏、折叠、恢复；
- 实现本地统计。

### Week 3：黑白名单与设置页

- 实现本地黑名单；
- 实现本地白名单；
- 实现 popup 面板；
- 实现 options 设置页；
- 实现导入导出 JSON。

### Week 4：测试、优化与发布准备

- 适配首页、评论区、搜索页；
- 优化 Selector Adapter；
- 完成隐私说明；
- 准备图标、截图、商店文案；
- 打包发布测试版。

---

## 15. 版本规划

| 版本 | 目标 | 主要能力 |
|---|---|---|
| V0.1 | 本地规则 MVP | 自动隐藏、恢复、黑白名单、统计 |
| V0.2 | 规则管理版 | 自定义关键词、权重、导入导出 |
| V0.3 | 评论区增强 | 重复评论识别、评论区专项净化 |
| V0.4 | 规则订阅 | 远程规则包、版本更新 |
| V0.5 | AI 辅助识别 | 轻量分类、相似账号识别、反馈学习 |

---

## 16. 商业化设计

### 免费版

- 基础自动隐藏；
- 本地黑名单；
- 本地白名单；
- 基础规则；
- 每日统计。

### Pro 版

- 高级规则；
- 自定义权重；
- 批量导入/导出；
- 评论区增强净化；
- 规则订阅；
- 跨设备同步；
- AI 辅助识别。

### 定价建议

早期建议买断制：

- 免费版：基础功能；
- Pro 版：9.9 美元一次性买断。

如后续有云同步和规则订阅，再考虑订阅制。

---

## 17. Chrome Web Store 文案草案

### 标题

X 清净助手 - 自动过滤低质账号和垃圾内容

### 简短描述

自动隐藏 X 信息流和评论区中的低质账号、垃圾营销和重复内容，让你的时间线更干净。

### 长描述

X 清净助手是一款专注于提升 X 浏览体验的浏览器插件。

它可以在本地自动识别并隐藏疑似低质账号、垃圾营销内容、重复评论和异常导流内容。所有判断默认在本地完成，不上传你的浏览记录。

主要功能：

- 自动隐藏低质账号内容；
- 净化首页时间线；
- 净化热门推文评论区；
- 支持本地黑名单；
- 支持本地白名单；
- 支持误判恢复；
- 支持过滤强度调节；
- 支持每日净化统计。

适合希望减少信息流噪音、提升 X 使用体验的用户。

---

## 18. 给 Codex 的首轮开发 Prompt

可以直接把下面这段发给 Codex：

```text
请根据本文档开发一个 Chrome Extension Manifest V3 项目，项目名为 cleanx-extension。

第一阶段只实现 V0.1 MVP：
1. 支持 x.com 和 twitter.com；
2. content script 使用 MutationObserver 扫描 article 节点；
3. 提取账号 handle、昵称、文本内容；
4. 使用本地规则计算风险分；
5. 高风险内容替换为占位条，支持恢复；
6. 支持本地黑名单和白名单；
7. popup 支持开启/关闭、过滤强度、今日统计；
8. options 支持管理黑名单、白名单、导入导出 JSON；
9. 所有数据保存在 chrome.storage.local；
10. 不接入任何 X API，不上传任何用户浏览数据。

请优先保证代码结构清晰、模块拆分合理、选择器适配易维护，并提供 README 和本地开发/打包说明。
```

---

## 19. 最小可开发版本定义

首版最小范围：

```text
Chrome 插件
只支持 x.com / twitter.com
只支持自动隐藏
只支持本地规则
只支持本地黑名单 / 白名单
不接 API
不做登录
不做云同步
不做 AI
```

核心判断标准：

> 打开 X 后，用户能明显感受到时间线和评论区变干净。
