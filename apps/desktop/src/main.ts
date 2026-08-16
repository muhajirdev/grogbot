import { app, BrowserWindow } from "electron";

/** Same value as CLOUD_WEB_ORIGIN in `@grogbot/contracts`. */
const CLOUD_WEB_ORIGIN = "https://app.grogbot.com";

/**
 * Packaged desktop is a thin client of the hosted office (app.grogbot.com,
 * which talks to api.grogbot.com). Dev still loads the local Vite server.
 * grogbot.com is the marketing site.
 */
function webUrl(): string {
  if (process.env.WEB_ORIGIN) return process.env.WEB_ORIGIN;
  return app.isPackaged ? CLOUD_WEB_ORIGIN : "http://127.0.0.1:5173";
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 880,
    minHeight: 600,
    title: "Grogbot",
    backgroundColor: "#000000",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition: { x: 16, y: 18 },
    ...(process.platform !== "darwin"
      ? {
          titleBarOverlay: {
            color: "#000000",
            symbolColor: "#f4f4f4",
            height: 44,
          },
        }
      : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  void win.loadURL(webUrl());
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
