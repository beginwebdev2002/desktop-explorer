import { Injectable } from '@angular/core';
import type {
  DirListing,
  DriveInfo,
  ElectronAPI,
  KnownFolders,
  MemoryInfo,
} from '../electron-api';

@Injectable({ providedIn: 'root' })
export class ElectronService {
  private readonly api: ElectronAPI | undefined =
    typeof window !== 'undefined' ? window.electronAPI : undefined;

  /** True when running inside Electron, false in a regular browser tab. */
  readonly isElectron = !!this.api;

  readonly versions = this.api?.versions ?? null;

  ping(): Promise<string> {
    return this.call((api) => api.ping());
  }

  getDrives(): Promise<DriveInfo[]> {
    return this.call((api) => api.getDrives());
  }

  getKnownFolders(): Promise<KnownFolders> {
    return this.call((api) => api.getKnownFolders());
  }

  readDir(dirPath: string): Promise<DirListing> {
    return this.call((api) => api.readDir(dirPath));
  }

  openPath(filePath: string): Promise<void> {
    return this.call((api) => api.openPath(filePath));
  }

  getMemory(): Promise<MemoryInfo> {
    return this.call((api) => api.getMemory());
  }

  private async call<T>(fn: (api: ElectronAPI) => Promise<T>): Promise<T> {
    if (!this.api) {
      throw new Error('Not running in Electron');
    }
    try {
      return await fn(this.api);
    } catch (err) {
      // Electron wraps errors as "Error invoking remote method 'fs:read-dir': Error: EPERM: ...".
      // Strip the wrapper so the message starts with the code (EPERM, ENOENT, ...).
      const message = (err as Error).message.replace(
        /^Error invoking remote method '[^']+': (Error: )?/,
        '',
      );
      throw new Error(message);
    }
  }
}
