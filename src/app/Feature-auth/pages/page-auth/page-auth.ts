import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { LayoutSlice } from '../../../shared/layout-slice/layout-slice';
import { Logo } from '../../../shared/logo/logo';
import { AuthService } from '../../data-access/auth-service';
import { Login } from '../../models/login';
import { Register } from '../../models/register';
import { ResultatEnvoi } from '../../models/resultat-envoi';
import { User } from '../../models/user';
import { FormAuth } from '../../ui/form-auth/form-auth';

const PAGE_APRES_CONNEXION = '/entreprises';

@Component({
  imports: [AsyncPipe, LayoutSlice, Logo, FormAuth],
  selector: 'app-page-auth',
  styleUrl: './page-auth.css',
  templateUrl: './page-auth.html',
})
export default class PageAuth {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Observable froid : la requête part quand le pipe async du template s'y abonne.
  protected envoi$: Observable<ResultatEnvoi> | null = null;

  protected seConnecter(identifiants: Login): void {
    this.envoi$ = this.suivreEnvoi(this.authService.connexion(identifiants));
  }

  protected creerUnCompte(compte: Register): void {
    this.envoi$ = this.suivreEnvoi(this.authService.creerUnCompte(compte));
  }

  private suivreEnvoi(envoi: Observable<User>): Observable<ResultatEnvoi> {
    return envoi.pipe(
      tap(() => this.router.navigateByUrl(PAGE_APRES_CONNEXION)),
      map(() => ({ erreur: null })),
      catchError((erreur: HttpErrorResponse) => of({ erreur: messageErreur(erreur) })),
    );
  }
}

function messageErreur(erreur: HttpErrorResponse): string {
  if (erreur.status === 401) {
    return 'E-mail ou mot de passe incorrect.';
  }
  if (erreur.status === 400) {
    return erreur.error?.error ?? 'Vérifiez les informations saisies.';
  }
  if (erreur.status === 0) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.';
  }
  return 'Une erreur est survenue. Réessayez plus tard.';
}
