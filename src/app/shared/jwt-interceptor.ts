import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../Feature-auth/data-access/auth-service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).session()?.token;

  // Le token ne part que vers notre API, jamais vers un autre domaine.
  if (!token || !req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  // Une requête est immuable : on en crée une copie avec le header en plus.
  const requeteAvecToken = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });
  return next(requeteAvecToken);
};
