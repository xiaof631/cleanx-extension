const X_URL_PATTERNS = ["https://x.com/*", "https://twitter.com/*"];

chrome.runtime.onInstalled.addListener(() => {
  console.info("[CleanX] installed");
  void injectContentIntoOpenXTabs();
});

chrome.runtime.onStartup.addListener(() => {
  void injectContentIntoOpenXTabs();
});

void injectContentIntoOpenXTabs();

async function injectContentIntoOpenXTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: X_URL_PATTERNS });
    await Promise.all(tabs.map((tab) => (tab.id ? injectContentIntoTab(tab.id) : Promise.resolve())));
  } catch (error) {
    console.warn("[CleanX] failed to inject content into open X tabs", error);
  }
}

async function injectContentIntoTab(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });

    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["content.css"]
    });
  } catch (error) {
    console.warn("[CleanX] failed to inject content into X tab", tabId, error);
  }
}
