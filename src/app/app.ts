import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ElectronService } from './electron.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('electron');
  protected readonly electron = inject(ElectronService);
  protected readonly pingResult = signal<string | null>(null);

  protected async ping(): Promise<void> {
    this.electron.ping().then((result) => {
      console.log('Ping: ', result);
    });
    try {
      // this.pingResult.set(await this.electron.ping());
    } catch (err) {
      // this.pingResult.set(`error: ${(err as Error).message}`);
    }
  }

  ngOnInit(): void {
    console.log('App: ', this.electron);
    this.electron.memory.then((result: any) => {
      console.log('Memory: ', result);
    });
  }
}
