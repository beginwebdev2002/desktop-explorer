const { contextBridge, ipcRenderer } = require('electron');

// Everything exposed here is available in Angular as `window.electronAPI`.
// Keep it small and explicit: never expose ipcRenderer itself.
contextBridge.exposeInMainWorld('electronAPI', {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    title: 'Hello World',
  },
  ping: () => ipcRenderer.invoke('ping'),

  // Explorer API — handlers live in main.js.
  getDrives: () => ipcRenderer.invoke('fs:drives'),
  getKnownFolders: () => ipcRenderer.invoke('fs:known-folders'),
  readDir: (dirPath) => ipcRenderer.invoke('fs:read-dir', dirPath),
  openPath: (filePath) => ipcRenderer.invoke('fs:open', filePath),
  getMemory: () => ipcRenderer.invoke('system:memory'),
});
