import { Component } from '@angular/core';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-drives',
  imports: [MatGridList, MatGridTile, MatIcon],
  templateUrl: './drives.component.html',
  styleUrl: './drives.component.scss',
})
export class DrivesComponent {}
