import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonSmall } from '../button-small/button-small';
import { Logo } from '../logo/logo';
import { Nav } from '../nav/nav';

@Component({
  imports: [RouterLink, Logo, Nav, ButtonSmall],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  // readonly deconnexion = output<void>();
  logout( ) {
    // this.authService.logout()
  }
}
