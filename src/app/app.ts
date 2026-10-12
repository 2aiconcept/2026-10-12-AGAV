import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutSlice } from './shared/layout-slice/layout-slice';
import { LayoutTopBottom } from './shared/layout-top-bottom/layout-top-bottom';
import { LayoutPages } from './shared/layout-pages/layout-pages';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LayoutSlice, LayoutTopBottom, LayoutPages],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mini-crm');
}
