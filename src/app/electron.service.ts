import { Injectable } from '@angular/core';
import type { ElectronAPI } from '../electron-api';

@Injectable({ providedIn: 'root' })
export class ElectronService {
  private readonly api: ElectronAPI | undefined =
    typeof window !== 'undefined' ? window.electronAPI : undefined;

  /** True when running inside Electron, false in a regular browser tab. */
  readonly isElectron = !!this.api;

  readonly versions = this.api?.versions ?? null;
  readonly memory = this.api?.versions.memory ?? null;

  ping(): Promise<string> {
    if (!this.api) {
      return Promise.reject(new Error('Not running in Electron'));
    }
    return this.api.ping();
  }
}
