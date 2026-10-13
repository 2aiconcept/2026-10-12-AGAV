import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeUtilisateur } from '../badge-utilisateur/badge-utilisateur';
import { ButtonSmall } from '../button-small/button-small';
import { Utilisateur } from '../utils/models/utilisateur';
import { Logo } from '../logo/logo';
import { Nav } from '../nav/nav';

@Component({
  imports: [RouterLink, Logo, Nav, ButtonSmall, BadgeUtilisateur],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  // En dur tant que la feature auth ne fournit pas l'utilisateur connecté.
  protected readonly utilisateur: Utilisateur = { prenom: 'Chris', nom: 'Martin' };

  // readonly deconnexion = output<void>();
  logout( ) {
    // this.authService.logout()
  }
}
