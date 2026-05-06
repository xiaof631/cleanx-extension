import { loadSettings } from "../storage";
import { restoreCleanXNodes } from "./renderer";
import { scanExistingNodes, startObserve, watchStorageChanges } from "./scanner";

async function bootstrap() {
  const settings = await loadSettings();
  watchStorageChanges();

  if (!settings.enabled) {
    restoreCleanXNodes();
    return;
  }

  if (settings.pauseUntil && Date.now() < new Date(settings.pauseUntil).getTime()) {
    return;
  }

  scanExistingNodes();
  startObserve();
}

void bootstrap().catch((error) => {
  console.error("[CleanX] bootstrap failed", error);
});
