const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readProfiles: () => ipcRenderer.invoke('profiles:read'),
  writeProfiles: (profiles) => ipcRenderer.invoke('profiles:write', profiles),
  openWindow: (path) => ipcRenderer.invoke('window:open', path)
});
