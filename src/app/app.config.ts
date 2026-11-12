import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash URLs (index.html#/page) keep routing working when Electron loads the build via file://
    provideRouter(routes, withHashLocation()),
    // Render <mat-icon> with the Material Symbols font (loaded in index.html) instead of the
    // legacy Material Icons font, which lacks newer icons such as `hard_drive`.
    // `mat-ligature-font` is required so `<mat-icon fontIcon="...">` renders the name as a ligature.
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined', 'mat-ligature-font');
    })
  ]
};
