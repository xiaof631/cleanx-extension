import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadSettings, saveSettings } from "../storage";
import { loadBlacklist } from "../storage/blacklist";
import { loadDetectionLog } from "../storage/detectionLog";
import { loadStats } from "../storage/stats";
import { loadWhitelist } from "../storage/whitelist";
import type { DailyStats, DetectionLogEntry, FilterLevel, Settings } from "../shared/types";
import "../ui.css";

function App() {
  const [settings, setSettings] = useState<Settings>();
  const [stats, setStats] = useState<DailyStats>();
  const [detectionLog, setDetectionLog] = useState<DetectionLogEntry[]>([]);
  const [blacklistCount, setBlacklistCount] = useState(0);
  const [whitelistCount, setWhitelistCount] = useState(0);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const [nextSettings, nextStats, blacklist, whitelist, nextDetectionLog] = await Promise.all([
      loadSettings(),
      loadStats(),
      loadBlacklist(),
      loadWhitelist(),
      loadDetectionLog()
    ]);
    setSettings(nextSettings);
    setStats(nextStats);
    setDetectionLog(nextDetectionLog);
    setBlacklistCount(blacklist.length);
    setWhitelistCount(whitelist.length);
  }

  async function updateSettings(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    await saveSettings(next);
    setSettings(next);
  }

  async function pauseThirtyMinutes() {
    await updateSettings({
      enabled: true,
      pauseUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });
  }

  if (!settings || !stats) return <div className="popup">加载中...</div>;

  const paused = settings.pauseUntil && Date.now() < new Date(settings.pauseUntil).getTime();
  const todayRiskyAccountCount = detectionLog.filter(
    (entry) => isToday(entry.lastSeenAt) && entry.action !== "show"
  ).length;

  return (
    <main className="popup">
      <div className="header">
        <div>
          <h1 className="title">X 清净助手</h1>
          <p className="subtitle">当前状态：{settings.enabled ? (paused ? "已暂停" : "已开启") : "已关闭"}</p>
        </div>
      </div>

      <section className="section stack">
        <button
          className={settings.enabled ? "" : "primary"}
          onClick={() => updateSettings({ enabled: !settings.enabled, pauseUntil: undefined })}
        >
          {settings.enabled ? "关闭清净模式" : "开启清净模式"}
        </button>
        <button onClick={pauseThirtyMinutes}>暂停 30 分钟</button>
      </section>

      <section className="section">
        <h2>今日净化</h2>
        <div className="stat-grid">
          <Stat label="已隐藏" value={stats.hiddenCount} />
          <Stat label="风险账号" value={todayRiskyAccountCount} />
          <Stat label="恢复次数" value={stats.restoreCount} />
          <Stat label="名单账号" value={blacklistCount + whitelistCount} />
        </div>
      </section>

      <section className="section">
        <h2>过滤强度</h2>
        <div className="segmented">
          {(["light", "standard", "strict"] as FilterLevel[]).map((level) => (
            <button
              key={level}
              className={settings.level === level ? "active" : ""}
              onClick={() => updateSettings({ level, pauseUntil: undefined })}
            >
              {levelLabel(level)}
            </button>
          ))}
        </div>
      </section>

      <section className="section stack">
        <button onClick={() => chrome.runtime.openOptionsPage()}>设置与名单管理</button>
        <button onClick={refresh}>刷新统计</button>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function levelLabel(level: FilterLevel) {
  return level === "light" ? "轻度" : level === "standard" ? "标准" : "严格";
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

createRoot(document.getElementById("root")!).render(<App />);
