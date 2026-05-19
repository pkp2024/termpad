const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readProfiles: () => ipcRenderer.invoke('profiles:read'),
  writeProfiles: (profiles) => ipcRenderer.invoke('profiles:write', profiles),
  openWindow: (path) => ipcRenderer.invoke('window:open', path),
  onUpdateAvailable: (cb) => ipcRenderer.on('update:available', (_e, version) => cb(version)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update:downloaded', () => cb()),
  onUpdateError: (cb) => ipcRenderer.on('update:error', () => cb()),
  installUpdate: () => ipcRenderer.send('update:install'),
});
