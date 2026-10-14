import { ErrorHandler, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../Feature-auth/data-access/auth-service';

export function errorsInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const router = inject(Router);
  const errorHandler = inject(ErrorHandler);

  return next(req).pipe(
    tap({
      error: (erreur: HttpErrorResponse) => {
        // 401 : token absent ou expiré (sauf sur /auth/login, où c'est un mauvais mot de passe).
        if (erreur.status === 401 && !req.url.includes('/auth/')) {
          authService.deconnexion();
          router.navigateByUrl('/connexion');
        }

        // 500 : erreur côté serveur, confiée au gestionnaire d'erreurs global d'Angular.
        if (erreur.status === 500) {
          errorHandler.handleError(erreur);
        }
      },
    }),
  );
}
