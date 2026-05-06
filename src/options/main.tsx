import React, { ChangeEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { exportConfig, importConfig, loadSettings, saveSettings } from "../storage";
import { addToBlacklist, loadBlacklist, removeFromBlacklist } from "../storage/blacklist";
import { clearDetectionLog, loadDetectionLog } from "../storage/detectionLog";
import { loadStats, resetTodayStats } from "../storage/stats";
import { addToWhitelist, loadWhitelist, removeFromWhitelist } from "../storage/whitelist";
import type { DailyStats, DetectionLogEntry, FilterLevel, HiddenMode, ListEntry, Settings } from "../shared/types";
import "../ui.css";

function App() {
  const [settings, setSettings] = useState<Settings>();
  const [stats, setStats] = useState<DailyStats>();
  const [blacklist, setBlacklist] = useState<ListEntry[]>([]);
  const [whitelist, setWhitelist] = useState<ListEntry[]>([]);
  const [detectionLog, setDetectionLog] = useState<DetectionLogEntry[]>([]);
  const [blackInput, setBlackInput] = useState("");
  const [whiteInput, setWhiteInput] = useState("");
  const [importText, setImportText] = useState("");
  const [error, setError] = useState("");
  const [logMode, setLogMode] = useState<"risky" | "all">("risky");

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const [nextSettings, nextStats, nextBlacklist, nextWhitelist, nextDetectionLog] = await Promise.all([
      loadSettings(),
      loadStats(),
      loadBlacklist(),
      loadWhitelist(),
      loadDetectionLog()
    ]);
    setSettings(nextSettings);
    setStats(nextStats);
    setBlacklist(nextBlacklist);
    setWhitelist(nextWhitelist);
    setDetectionLog(nextDetectionLog);
  }

  async function updateSettings(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    await saveSettings(next);
    setSettings(next);
  }

  async function addManualListEntry(kind: "black" | "white") {
    const username = (kind === "black" ? blackInput : whiteInput).trim().replace(/^@/, "");
    if (!username) return;

    if (kind === "black") {
      await addToBlacklist({ username }, "profile", "manual");
      setBlackInput("");
    } else {
      await addToWhitelist({ username }, "profile", "manual");
      setWhiteInput("");
    }

    await refresh();
  }

  async function downloadConfig() {
    const config = await exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cleanx-config-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFromText() {
    setError("");
    try {
      await importConfig(JSON.parse(importText));
      setImportText("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败");
    }
  }

  function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  if (!settings || !stats) return <main className="page">加载中...</main>;

  const hasLegacyScanCount = detectionLog.length === 0 && stats.scannedAccountCount > 0;
  const riskyDetectionLog = detectionLog.filter((entry) => entry.action !== "show");
  const visibleDetectionLog = logMode === "risky" ? riskyDetectionLog : detectionLog;

  return (
    <main className="page">
      <div className="page__inner">
        <header className="header">
          <div>
            <h1 className="title">X 清净助手设置</h1>
            <p className="subtitle">所有识别、名单和统计均保存在浏览器本地。</p>
          </div>
        </header>

        <section className="section">
          <h2>基础设置</h2>
          <div className="grid">
            <label className="stack">
              <span className="muted">清净模式</span>
              <select
                value={settings.enabled ? "on" : "off"}
                onChange={(event) => updateSettings({ enabled: event.target.value === "on" })}
              >
                <option value="on">开启</option>
                <option value="off">关闭</option>
              </select>
            </label>
            <label className="stack">
              <span className="muted">隐藏方式</span>
              <select
                value={settings.hiddenMode}
                onChange={(event) => updateSettings({ hiddenMode: event.target.value as HiddenMode })}
              >
                <option value="hide">占位隐藏</option>
                <option value="collapse">折叠</option>
                <option value="blur">模糊</option>
              </select>
            </label>
          </div>
        </section>

        <section className="section">
          <h2>规则强度</h2>
          <div className="segmented">
            {(["light", "standard", "strict"] as FilterLevel[]).map((level) => (
              <button
                key={level}
                className={settings.level === level ? "active" : ""}
                onClick={() => updateSettings({ level })}
              >
                {levelLabel(level)}
              </button>
            ))}
          </div>
        </section>

        <div className="grid">
          <ListManager
            title="黑名单管理"
            value={blackInput}
            onValueChange={setBlackInput}
            onAdd={() => addManualListEntry("black")}
            entries={blacklist}
            onRemove={async (username) => {
              await removeFromBlacklist(username);
              await refresh();
            }}
          />
          <ListManager
            title="白名单管理"
            value={whiteInput}
            onValueChange={setWhiteInput}
            onAdd={() => addManualListEntry("white")}
            entries={whitelist}
            onRemove={async (username) => {
              await removeFromWhitelist(username);
              await refresh();
            }}
          />
        </div>

        <section className="section">
          <div className="row between">
            <h2>最近风险账号</h2>
            <div className="row">
              <div className="segmented compact-tabs">
                <button
                  className={logMode === "risky" ? "active" : ""}
                  onClick={() => setLogMode("risky")}
                >
                  风险
                </button>
                <button
                  className={logMode === "all" ? "active" : ""}
                  onClick={() => setLogMode("all")}
                >
                  全部
                </button>
              </div>
              <button onClick={refresh}>刷新</button>
              <button
                className="danger"
                onClick={async () => {
                  await clearDetectionLog();
                  await refresh();
                }}
              >
                清空
              </button>
            </div>
          </div>
          <div className="list">
            {hasLegacyScanCount ? (
              <div className="notice">
                当前有旧版统计的 {stats.scannedAccountCount} 个识别账号，但旧版没有保存账号明细。刷新 X 页面并滚动后，新识别记录会出现在这里。
                <button
                  onClick={async () => {
                    await resetTodayStats();
                    await refresh();
                  }}
                >
                  清空今日统计
                </button>
              </div>
            ) : null}
            {detectionLog.length === 0 && !hasLegacyScanCount ? (
              <div className="muted">暂无识别记录。打开或刷新 X 页面后会在这里出现账号明细。</div>
            ) : null}
            {detectionLog.length > 0 && visibleDetectionLog.length === 0 ? (
              <div className="muted">暂无风险账号。当前扫描到的账号都没有达到折叠或隐藏阈值。</div>
            ) : null}
            {visibleDetectionLog.map((entry) => (
              <DetectionLogItem key={entry.username} entry={entry} />
            ))}
          </div>
        </section>

        <section className="section">
          <h2>数据导入 / 导出</h2>
          <div className="stack">
            <div className="row wrap">
              <button className="primary" onClick={downloadConfig}>导出配置</button>
              <input type="file" accept="application/json" onChange={handleFileImport} />
            </div>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="粘贴 CleanX 配置 JSON"
            />
            <div className="row between">
              <button onClick={importFromText}>导入 JSON</button>
              {error ? <span className="error">{error}</span> : null}
            </div>
          </div>
        </section>

        <section className="section">
          <h2>隐私说明</h2>
          <p className="subtitle">
            CleanX V0.1 不调用 X 非公开接口，不上传时间线内容，不做跨站跟踪。导入和导出只在用户主动操作时发生。
          </p>
        </section>
      </div>
    </main>
  );
}

function DetectionLogItem({ entry }: { entry: DetectionLogEntry }) {
  const reasonText = entry.reasons.length
    ? entry.reasons.map((reason) => reason.label).join("、")
    : "未命中高风险规则";

  return (
    <div className="list-item align-start">
      <div className="stack compact">
        <div>
          <span className="handle">@{entry.username}</span>
          {entry.displayName ? <span className="muted"> · {entry.displayName}</span> : null}
        </div>
        <div className="row wrap">
          <span className={`badge badge-${entry.action}`}>{actionLabel(entry.action)}</span>
          <span className="muted">风险分 {entry.score}</span>
          <span className="muted">{sourceLabel(entry.source)}</span>
          <span className="muted">出现 {entry.seenCount} 次</span>
        </div>
        <div className="muted">{reasonText}</div>
        <div className="muted">最近：{formatTime(entry.lastSeenAt)}</div>
      </div>
    </div>
  );
}

function ListManager({
  title,
  value,
  onValueChange,
  onAdd,
  entries,
  onRemove
}: {
  title: string;
  value: string;
  onValueChange: (value: string) => void;
  onAdd: () => void;
  entries: ListEntry[];
  onRemove: (username: string) => void;
}) {
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="stack">
        <div className="row">
          <input value={value} onChange={(event) => onValueChange(event.target.value)} placeholder="@username" />
          <button onClick={onAdd}>添加</button>
        </div>
        <div className="list">
          {entries.length === 0 ? <div className="muted">暂无账号</div> : null}
          {entries.map((entry) => (
            <div className="list-item" key={entry.username}>
              <div>
                <div className="handle">@{entry.username}</div>
                <div className="muted">{entry.reason} · {entry.source}</div>
              </div>
              <button className="danger" onClick={() => onRemove(entry.username)}>移除</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function levelLabel(level: FilterLevel) {
  return level === "light" ? "轻度" : level === "standard" ? "标准" : "严格";
}

function actionLabel(action: DetectionLogEntry["action"]) {
  if (action === "hide") return "隐藏";
  if (action === "collapse") return "折叠";
  return "展示";
}

function sourceLabel(source: DetectionLogEntry["source"]) {
  if (source === "comment") return "评论区";
  if (source === "search") return "搜索";
  if (source === "profile") return "资料";
  return "时间线";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

createRoot(document.getElementById("root")!).render(<App />);
