import { Component, inject } from '@angular/core';
import { LayoutSlice } from '../../../shared/layout-slice/layout-slice';
import { Logo } from '../../../shared/logo/logo';
import { AuthService } from '../../data-access/auth-service';

@Component({
  imports: [LayoutSlice, Logo],
  selector: 'app-page-auth',
  styleUrl: './page-auth.css',
  templateUrl: './page-auth.html',
})
export default class PageAuth {
  authService = inject(AuthService);

  seConnecter() {
    this.authService.connexion();
  }
}
