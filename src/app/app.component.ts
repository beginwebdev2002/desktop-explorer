import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ElectronService } from './electron.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
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
    // this.electron.getKnownFolders().then((result) => {
    //   console.log('Known Folders: ', result);
    // });

    // this.electron.readDir('C:\\').then((result) => {
    //   const newResult = result.entries.filter((item) => item.isSymlink === false);
    //   console.log('Directory Listing: ', newResult);
    // });
    this.electron.getDrives().then((result) => {
      console.log('Drives: ', result);
    });
  }
}
