const { contextBridge, ipcRenderer } = require('electron');

// Everything exposed here is available in Angular as `window.electronAPI`.
// Keep it small and explicit: never expose ipcRenderer itself.
contextBridge.exposeInMainWorld('electronAPI', {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    title: 'Hello World',
    memory: process.getProcessMemoryInfo(),
  },
  ping: () => ipcRenderer.invoke('ping'),
});
