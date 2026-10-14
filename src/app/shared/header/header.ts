import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Feature-auth/data-access/auth-service';
import { BadgeUtilisateur } from '../badge-utilisateur/badge-utilisateur';
import { ButtonSmall } from '../button-small/button-small';
import { Logo } from '../logo/logo';
import { Nav } from '../nav/nav';

const PAGE_APRES_DECONNEXION = '/connexion';

@Component({
  imports: [AsyncPipe, RouterLink, Logo, Nav, ButtonSmall, BadgeUtilisateur],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authService.deconnexion();
    this.router.navigateByUrl(PAGE_APRES_DECONNEXION);
  }
}
