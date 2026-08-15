import { CLOUD_WEB_ORIGIN } from "@grogbot/contracts";
import { app, BrowserWindow } from "electron";

/**
 * Packaged desktop is a thin client of the hosted web app (which talks to
 * api.grogbot.com). Dev still loads the local Vite server.
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
    backgroundColor: "#f6f5f2",
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
