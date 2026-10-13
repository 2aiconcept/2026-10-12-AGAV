import { Component } from '@angular/core';
import { LayoutSlice } from '../../../shared/layout-slice/layout-slice';
import { Logo } from '../../../shared/logo/logo';

@Component({
  imports: [LayoutSlice, Logo],
  selector: 'app-page-auth',
  styleUrl: './page-auth.css',
  templateUrl: './page-auth.html',
})
export default class PageAuth {}
