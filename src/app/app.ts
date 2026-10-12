import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutSlice } from './shared/layout-slice/layout-slice';
import { LayoutTopBottom } from './shared/layout-top-bottom/layout-top-bottom';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LayoutSlice, LayoutTopBottom],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mini-crm');
}
