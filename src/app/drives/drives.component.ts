import { Component, inject, OnInit, signal } from '@angular/core';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import type { DriveInfo } from '../../electron-api';
import { ElectronService } from '../electron.service';
import { driveTitle, driveTypeIcon, driveTypeName, formatSize } from './drive-display';

@Component({
  selector: 'app-drives',
  imports: [MatGridList, MatGridTile, MatIcon, MatProgressBar],
  templateUrl: './drives.component.html',
  styleUrl: './drives.component.scss',
})
export class DrivesComponent implements OnInit {
  private readonly electron = inject(ElectronService);

  protected readonly drives = signal<DriveInfo[]>([]);
  protected readonly error = signal<string | null>(null);

  // Helpers for the template.
  protected readonly title = driveTitle;
  protected readonly typeName = driveTypeName;
  protected readonly typeIcon = driveTypeIcon;
  protected readonly formatSize = formatSize;

  async ngOnInit(): Promise<void> {
    try {
      this.drives.set(await this.electron.getDrives());
    } catch (err) {
      // e.g. 'Not running in Electron' when opened with plain `ng serve` in a browser.
      this.error.set((err as Error).message);
    }
  }
}
