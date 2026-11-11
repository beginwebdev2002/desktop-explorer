// Shape of the API exposed by electron/preload.js via contextBridge.
// All sizes are in bytes, all dates are timestamps in ms (use with `new Date(x)` or the `date` pipe).

export interface DriveInfo {
  /** 'C:' */
  name: string;
  /** 'C:\\' — pass this to readDir() */
  path: string;
  total: number;
  free: number;
  used: number;
}

export interface FileEntry {
  name: string;
  /** Full path, e.g. 'C:\\Users\\me\\file.txt' */
  path: string;
  isDirectory: boolean;
  /** Symlink or junction (e.g. 'C:\\Documents and Settings') */
  isSymlink: boolean;
  /** Lower-case, without dot: 'pdf'. Empty for folders and files without extension. */
  extension: string;
  /** null for folders and for locked files (pagefile.sys) */
  size: number | null;
  modified: number | null;
  created: number | null;
}

export interface DirListing {
  /** Normalized path of the folder that was read */
  path: string;
  /** Parent folder, or null at a drive root ('C:\\') */
  parent: string | null;
  /** Folders first, then files; natural sort like Windows Explorer */
  entries: FileEntry[];
}

export interface KnownFolders {
  home: string;
  desktop: string;
  documents: string;
  downloads: string;
  pictures: string;
  music: string;
  videos: string;
}

export interface MemoryInfo {
  /** RAM of the computer */
  systemTotal: number;
  systemFree: number;
  systemUsed: number;
  /** RAM used by this app (all Electron processes together) */
  appUsed: number;
}

export interface ElectronAPI {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  ping(): Promise<string>;

  getDrives(): Promise<DriveInfo[]>;
  getKnownFolders(): Promise<KnownFolders>;
  /** Rejects with 'EPERM: ...' (no access) or 'ENOENT: ...' (not found) */
  readDir(dirPath: string): Promise<DirListing>;
  /** Opens a file with its default program */
  openPath(filePath: string): Promise<void>;
  getMemory(): Promise<MemoryInfo>;
}

declare global {
  interface Window {
    // Undefined when the app runs in a normal browser (plain `ng serve`).
    electronAPI?: ElectronAPI;
  }
}
