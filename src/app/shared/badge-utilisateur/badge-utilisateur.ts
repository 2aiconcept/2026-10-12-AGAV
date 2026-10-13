import { Component, input } from '@angular/core';
import { InitialesPipe } from '../pipes/initiales-pipe';
import { Utilisateur } from '../utils/models/utilisateur';

@Component({
  imports: [InitialesPipe],
  selector: 'app-badge-utilisateur',
  styleUrl: './badge-utilisateur.css',
  templateUrl: './badge-utilisateur.html',
})
export class BadgeUtilisateur {
  readonly utilisateur = input.required<Utilisateur>();
}
