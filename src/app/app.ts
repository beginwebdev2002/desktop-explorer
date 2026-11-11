import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ElectronService } from './electron.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('electron');
  protected readonly electron = inject(ElectronService);
  protected readonly pingResult = signal<string | null>(null);

  protected async ping(): Promise<void> {
    try {
      this.pingResult.set(await this.electron.ping());
    } catch (err) {
      this.pingResult.set(`error: ${(err as Error).message}`);
    }
  }
}
