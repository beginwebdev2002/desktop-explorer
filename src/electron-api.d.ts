// Shape of the API exposed by electron/preload.js via contextBridge.
export interface ElectronAPI {
  versions: {
    node: string;
    chrome: string;
    electron: string;
    memory: Electron.ProcessMemoryInfo;
  };
  ping(): Promise<string>;
}

declare global {
  interface Window {
    // Undefined when the app runs in a normal browser (plain `ng serve`).
    electronAPI?: ElectronAPI;
  }
}
