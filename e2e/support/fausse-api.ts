/*
 * Une fausse API pour les tests e2e
 * ---------------------------------
 * Pourquoi ? La vraie API est partagée par tous les stagiaires : si les tests créaient ou
 * supprimaient de vraies entreprises, ils modifieraient les données des autres, et leurs
 * résultats dépendraient de ce que les autres ont fait. Un test doit être INDÉPENDANT et
 * REPRODUCTIBLE : même entrée, même résultat, à chaque lancement.
 *
 * Comment ? page.route() intercepte les requêtes HTTP du navigateur AVANT qu'elles partent sur
 * le réseau, et nous laisse y répondre nous-mêmes (route.fulfill). L'application ne voit aucune
 * différence : elle croit parler à la vraie API. Chaque test crée sa propre FausseApi, avec ses
 * propres données de départ : aucun test ne dépend d'un autre.
 *
 * Doc officielle : https://playwright.dev/docs/mock
 */

// Page : l'onglet du navigateur piloté par Playwright ; Route : une requête interceptée.
import { Page, Route } from '@playwright/test';
// On réutilise l'URL de l'API de l'application : une seule source de vérité.
import { environment } from '../../src/environments/environment';
// On réutilise aussi les types de l'application, pour que les fausses réponses aient la même forme.
import { Entreprise } from '../../src/app/Feature-entreprises/models/entreprise';
import { User } from '../../src/app/Feature-auth/models/user';

// Le compte de démonstration, comme sur la vraie API.
export const COMPTE_DEMO = { email: 'user@test.com', password: 'password123' };

// La session renvoyée par la fausse API après une connexion réussie.
export const SESSION_DEMO: User = {
  token: 'faux-token-jwt-e2e',
  user: { id: 2, email: COMPTE_DEMO.email, nom: 'Stagiaire', prenom: 'Angular', role: 'user' },
};

// Toutes les requêtes de l'application commencent par cette adresse.
const URL_API = environment.apiBaseUrl;

export class FausseApi {
  // Les entreprises « en base » pour CE test. Elles évoluent quand l'application crée,
  // modifie ou supprime : on peut ensuite vérifier ce que l'API a reçu.
  readonly entreprises: Entreprise[];
  // Prochain id attribué à une entreprise créée (comme le ferait une vraie base de données).
  private prochainId = 100;
  // Si vrai, la liste des entreprises répond par une erreur 500 (pour tester l'affichage d'erreur).
  private isListeEnErreur = false;

  // On reçoit la page à piloter et les entreprises de départ de ce test.
  constructor(
    private readonly page: Page,
    entreprisesDeDepart: Entreprise[] = [],
  ) {
    // Copie de chaque entreprise : le test garde ses données de départ intactes.
    this.entreprises = entreprisesDeDepart.map((entreprise) => ({ ...entreprise }));
  }

  // Branche la fausse API sur la page. À appeler AVANT page.goto(), sinon les premières
  // requêtes partiraient vers la vraie API.
  async brancher(): Promise<void> {
    // « ** » : toutes les URL qui commencent par l'adresse de l'API.
    await this.page.route(`${URL_API}/**`, (route) => this.repondre(route));
  }

  // Les prochaines lectures de la liste échoueront avec une erreur 500.
  simulerPanneDeLaListe(): void {
    this.isListeEnErreur = true;
  }

  // Choisit la réponse selon la méthode HTTP et le chemin demandés.
  private async repondre(route: Route): Promise<void> {
    // La requête interceptée : méthode (GET, POST…), URL et corps.
    const requete = route.request();
    const methode = requete.method();
    // Le chemin après l'URL de l'API, par exemple « /entreprises/3 ».
    const chemin = requete.url().replace(URL_API, '');

    // --- Authentification ---
    if (methode === 'POST' && chemin === '/auth/login') {
      // postDataJSON() : le corps de la requête, déjà converti en objet.
      const { email, password } = requete.postDataJSON();
      // Bons identifiants : 200 et la session ; sinon 401, comme la vraie API.
      const isBonsIdentifiants = email === COMPTE_DEMO.email && password === COMPTE_DEMO.password;
      return isBonsIdentifiants
        ? route.fulfill({ status: 200, json: SESSION_DEMO })
        : route.fulfill({ status: 401, json: { error: 'Email ou mot de passe incorrect' } });
    }
    if (methode === 'POST' && chemin === '/auth/register') {
      const { email, nom, prenom } = requete.postDataJSON();
      // L'e-mail du compte de démo est déjà pris : 400, comme la vraie API.
      if (email === COMPTE_DEMO.email) {
        return route.fulfill({ status: 400, json: { error: 'Email deja utilise' } });
      }
      // Sinon, 201 (« créé ») et une session pour le nouvel utilisateur.
      return route.fulfill({
        status: 201,
        json: { token: 'faux-token-nouveau', user: { id: 3, email, nom, prenom, role: 'user' } },
      });
    }

    // --- Entreprises : liste et création ---
    if (chemin === '/entreprises') {
      if (methode === 'GET') {
        return this.isListeEnErreur
          ? route.fulfill({ status: 500, json: { error: 'Erreur serveur' } })
          : route.fulfill({ status: 200, json: this.entreprises });
      }
      if (methode === 'POST') {
        // On « enregistre » l'entreprise reçue avec un nouvel id, et on la renvoie.
        const creee: Entreprise = { id: this.prochainId++, ...requete.postDataJSON() };
        this.entreprises.push(creee);
        return route.fulfill({ status: 201, json: creee });
      }
    }

    // --- Entreprises : une entreprise précise (/entreprises/{id}) ---
    // match() avec une expression régulière : récupère l'id dans le chemin.
    const correspondance = chemin.match(/^\/entreprises\/(\d+)$/);
    if (correspondance) {
      const id = Number(correspondance[1]);
      // findIndex : position de l'entreprise dans la liste (-1 si elle n'existe pas).
      const position = this.entreprises.findIndex((entreprise) => entreprise.id === id);
      if (position === -1) {
        return route.fulfill({ status: 404, json: { error: 'Entreprise non trouvée' } });
      }
      if (methode === 'GET') {
        return route.fulfill({ status: 200, json: this.entreprises[position] });
      }
      if (methode === 'PUT') {
        // Mise à jour partielle : on garde l'existant et on écrase avec ce qui est envoyé.
        this.entreprises[position] = { ...this.entreprises[position], ...requete.postDataJSON() };
        return route.fulfill({ status: 200, json: this.entreprises[position] });
      }
      if (methode === 'DELETE') {
        // splice : retire l'entreprise de la liste.
        this.entreprises.splice(position, 1);
        return route.fulfill({ status: 200, json: { message: 'Entreprise supprimée' } });
      }
    }

    // Toute autre requête : on la signale clairement, plutôt que de la laisser partir en vrai.
    return route.fulfill({ status: 501, json: { error: `Non simulé : ${methode} ${chemin}` } });
  }
}
