import { Component } from '@angular/core';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatIcon, MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-drives',
  imports: [MatGridList, MatGridTile, MatIconModule],
  templateUrl: './drives.component.html',
  styleUrl: './drives.component.scss',
})
export class DrivesComponent {}
