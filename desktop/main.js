import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { startServer } from "../server.js";

const require = createRequire(import.meta.url);
const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

let appServer;
let serverUrl;

function profilesPath() {
  return join(app.getPath("userData"), "profiles.json");
}

function readSavedProfiles() {
  try {
    return JSON.parse(readFileSync(profilesPath(), "utf8"));
  } catch {
    return null;
  }
}

ipcMain.handle("profiles:read", () => readSavedProfiles());

ipcMain.handle("profiles:write", (_event, profiles) => {
  writeFileSync(profilesPath(), JSON.stringify(profiles));
  return true;
});

ipcMain.handle("window:open", (_event, path) => {
  createWindow(path);
});

function createWindow(path = "/") {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: "Termpad",
    backgroundColor: "#101114",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(app.getAppPath(), "desktop", "preload.cjs")
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(serverUrl)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 1280,
          height: 820,
          minWidth: 980,
          minHeight: 680,
          title: "Termpad",
          backgroundColor: "#101114",
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            preload: join(app.getAppPath(), "desktop", "preload.cjs")
          }
        }
      };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  window.loadURL(`${serverUrl}${path}`);
  return window;
}

autoUpdater.on("update-downloaded", () => {
  dialog.showMessageBox({
    type: "info",
    title: "Update ready",
    message: "A new version of Termpad has been downloaded. Restart now to apply it?",
    buttons: ["Restart", "Later"]
  }).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall();
  });
});

app.whenReady().then(async () => {
  const { session } = require("electron");
  if (!app.isPackaged) await session.defaultSession.clearCache();
  const serverInfo = await startServer({ port: 0, appRoot: app.getAppPath() });
  appServer = serverInfo.server;
  serverUrl = serverInfo.url;

  const profileName = process.argv.slice(app.isPackaged ? 1 : 2).find(a => !a.startsWith("-"));
  if (profileName) {
    const saved = readSavedProfiles();
    const profiles = saved?.profiles ?? [];
    const profile = profiles.find(p => p.name.toLowerCase() === profileName.toLowerCase());
    createWindow(profile ? `/?launchProfile=${encodeURIComponent(profile.id)}` : "/");
  } else {
    createWindow();
  }

  if (app.isPackaged) autoUpdater.checkForUpdates();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  appServer?.close();
});
