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

function notifyWindows(channel, ...args) {
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send(channel, ...args));
}

autoUpdater.on("update-available", (info) => {
  notifyWindows("update:available", info.version);
});

autoUpdater.on("update-downloaded", () => {
  notifyWindows("update:downloaded");
});

autoUpdater.on("error", (err) => {
  console.error("Auto-updater:", err.message);
});

ipcMain.on("update:install", () => autoUpdater.quitAndInstall());

async function checkForUpdateManually() {
  try {
    const res = await fetch("https://api.github.com/repos/pkp2024/termpad/releases/latest");
    const { tag_name } = await res.json();
    const latest = tag_name?.replace(/^v/, "");
    const current = app.getVersion();
    if (latest && latest !== current) {
      notifyWindows("update:available", latest);
    }
  } catch {
    // network issue, skip silently
  }
}

app.whenReady().then(async () => {
  const { session } = require("electron");
  if (!app.isPackaged) await session.defaultSession.clearCache();
  const serverInfo = await startServer({ port: 0, appRoot: app.getAppPath() });
  appServer = serverInfo.server;
  serverUrl = serverInfo.url;

  const rawArgs = process.argv.slice(app.isPackaged ? 1 : 2);
  let cwdArg = null;
  let profileName = null;
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === "--cwd" && rawArgs[i + 1]) { cwdArg = rawArgs[++i]; }
    else if (rawArgs[i].startsWith("--cwd=")) { cwdArg = rawArgs[i].slice(6); }
    else if (!rawArgs[i].startsWith("-") && !profileName) { profileName = rawArgs[i]; }
  }

  if (cwdArg) {
    createWindow(`/?openShell=${encodeURIComponent(cwdArg)}`);
  } else if (profileName) {
    const saved = readSavedProfiles();
    const profiles = saved?.profiles ?? [];
    const profile = profiles.find(p => p.name.toLowerCase() === profileName.toLowerCase());
    createWindow(profile ? `/?launchProfile=${encodeURIComponent(profile.id)}` : "/");
  } else {
    createWindow();
  }

  if (app.isPackaged) {
    checkForUpdateManually();
    if (process.env.APPIMAGE) autoUpdater.checkForUpdates();
  }
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
