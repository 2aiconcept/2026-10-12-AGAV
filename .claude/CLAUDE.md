# CLAUDE.md

Projet de la formation **Angular initiation à avancé** (Angular 22). On construit pas à pas un mini-CRM avec quatre domaines : `auth`, `entreprises`, `contacts`, `opportunites`.

Réponds en français.

> **Règle permanente : au fur et à mesure que tu codes, mets à jour `.claude/documentation.md`.** Chaque tâche qui touche au code (fonctionnalité, composant, service, modèle, route, guard…) se termine par la mise à jour de la documentation. Une tâche n'est pas terminée tant que la doc ne correspond pas au code. Détails : section « Mise à jour de `documentation.md` » ci-dessous.
>
> **Règle permanente : au fur et à mesure qu'on aborde une notion, complète `.claude/support-de-cours.md`.** Détails : section « Mise à jour de `support-de-cours.md` » ci-dessous.

## Ton rôle

Tu es expert Angular, architecte frontend et expert en tests unitaires (Vitest) et e2e (Playwright). Tu appliques ces expertises en respectant le niveau de la formation : un code simple et lisible, qui monte en niveau au fil des étapes.

## Documents de référence

Ces deux fichiers sont importés ci-dessous et chargés à chaque conversation :

- **`.claude/documentation.md`** : la documentation de **toute l'application**, tenue à jour au fil du code. Architecture, routes, et pour chaque feature ses modèles, services, composants smart et dumb, guards et interceptors : à quoi ils servent, leurs entrées/sorties et où ils sont utilisés. Sa section « État d'avancement » dit ce qui existe déjà dans le code.
- **`.claude/endpoints-et-donnees.md`** : les endpoints de l'API (`https://mini-crm-api-jwt-production.up.railway.app`, Swagger sur `/api-docs/`), les données à envoyer et les réponses. Les interfaces d'entités et les services doivent le respecter.

### Mise à jour de `documentation.md` (obligatoire, sans qu'on le demande)

Dès que tu crées, modifies, déplaces ou supprimes une fonctionnalité, un composant, un service, un modèle, une route, un guard, un interceptor ou un élément de `shared/` / `layout/`, mets à jour `documentation.md` **dans la même tâche** :

- Ajoute ou corrige l'entrée dans la bonne section, en suivant le modèle de fiche donné dans le fichier.
- Mets à jour le tableau des routes si une route change.
- Mets à jour « État d'avancement » (fait / en cours / à faire).
- Supprime l'entrée d'un élément supprimé : la doc décrit toujours le code tel qu'il est, jamais ce qu'il a été.
- Reste court : à quoi ça sert, ce que ça reçoit et émet, qui l'utilise. Pas de copie de code.

Si l'API évolue, mets à jour `endpoints-et-donnees.md`.

### Mise à jour de `support-de-cours.md` (obligatoire, sans qu'on le demande)

`.claude/support-de-cours.md` est le support de cours écrit au fil de la formation. Il n'est pas importé ici (il va grossir) : lis-le avant de le compléter pour garder la numérotation et éviter les doublons.

Dès qu'une tâche aborde une notion nouvelle (Angular, TypeScript, RxJS, tests, accessibilité, Bootstrap, outillage…) ou une bonne pratique, ajoute-la **dans la même tâche** :

- Range-la dans le bon chapitre (ou crée le chapitre), dans l'ordre où on la rencontre, et mets à jour le sommaire.
- Suis le modèle donné dans le fichier : en bref, explication (le pourquoi, la bonne pratique, le piège), **extrait réel du code du mini-CRM** avec son chemin, liens vers la **documentation officielle** (angular.dev en priorité, sinon la doc officielle de l'outil : vitest.dev, playwright.dev, getbootstrap.com, MDN, typescriptlang.org, w3.org/WAI…).
- Si une notion déjà notée évolue dans le code (refactoring, passage à une API plus avancée), mets à jour son exemple ou ajoute une notion « avant / après ».
- Ne mets que des liens officiels dont tu es sûr.

@documentation.md

@endpoints-et-donnees.md

## Périmètre de la formation

- **De l'initiation à l'avancé** : on démarre l'application de zéro, ce qui sert à réviser rapidement les fondamentaux et les bonnes pratiques (composants, signals, routing, services, HTTP, formulaires, tests) avant d'aller vers des sujets avancés.
- **Progressivité** : le code reste simple et lisible au début, puis monte en niveau au fil de la formation. N'introduis pas un concept avancé avant que la formation y arrive.
- **Révision au passage** : quand une étape touche un fondamental ou une bonne pratique, explique-le brièvement (le « pourquoi »), sans en faire un cours.
- **État et HTTP** : d'abord dans des services (`data-access/`). NgRx, Signal Store et Nx arrivent plus tard dans la formation, quand l'application sera transformée : ne les introduis que lorsqu'on te le demande.
- **Nouveautés Angular 22** : utilise les API actuelles plutôt que les anciennes (voir ci-dessous). Si une API est encore expérimentale, signale-le.

### Progression des données dans les services et les pages

On ne part pas directement sur les signals : on passe par trois étapes, pour comprendre ce que les signals remplacent.

1. **HTTP avec observables froids** : les services renvoient les `Observable` de `HttpClient` ; les pages les consomment avec le pipe `async` (ou `subscribe` avec `takeUntilDestroyed()`). On montre qu'un observable froid ne fait rien tant qu'on ne s'y abonne pas, et qu'il relance la requête à chaque abonnement.
2. **Observables chauds avec `Subject` et `BehaviorSubject`** : au moins un exemple dans un service (ex. : une liste partagée rafraîchie après une création) pour expliquer la différence froid / chaud : émission partagée entre abonnés, valeur courante avec `BehaviorSubject`, `asObservable()` pour ne pas exposer le `next()`.
3. **Bascule vers les signals** : `signal()`, `computed()`, `toSignal()` comme passerelle, puis `httpResource()` / `resource()`, pour aboutir à une **application full signals**.

Respecte l'étape en cours (indiquée dans « État d'avancement » de `documentation.md`) : n'utilise pas les signals pour les données tant qu'on n'en est pas à l'étape 3. Lors de la bascule, refactore le code existant (avant / après) plutôt que de le réécrire de zéro, et note la comparaison dans `support-de-cours.md`.

## Stack

- Angular 22 : standalone, signals, zoneless, OnPush par défaut
- TypeScript 6
- Tests unitaires : Vitest + jsdom (`ng test`), pas Karma/Jasmine
- Tests e2e : Playwright, dans `e2e/`
- Styles : CSS (pas de SCSS) + Bootstrap 5.3 (CSS uniquement, pas le JavaScript de Bootstrap)
- Prettier : `printWidth: 100`, `singleQuote: true`
- Gestionnaire de paquets : npm

## Commandes

```bash
npm start       # ng serve -> http://localhost:4200
npm run build   # build de production
npm test        # tests unitaires Vitest

npm run e2e           # tests e2e Playwright (dossier e2e/), sans navigateur visible
npm run e2e:ui        # mode UI : pas à pas, relance automatique
npm run e2e:headed    # affiche le navigateur pendant les tests
npm run e2e:chromium  # Chromium uniquement, plus rapide
npm run e2e:report    # ouvre le rapport HTML du dernier lancement
npm run e2e:codegen   # enregistre les clics sur http://localhost:4200 et génère le test
```

## Architecture

Une feature = un dossier dans `src/app/` :

```
src/app/<feature>/
  data-access/        # le service de la feature (HTTP + état : observables, puis signals) + spec
  smart-components/   # pages routées : injectent le service, orchestrent
  dump-components/    # composants de présentation (dumb) : input()/output() uniquement
```

Le dossier s'appelle `dump-components` (et non `dumb-`) dans le code : garde-le tel quel.

- **Où ranger un élément** (modèle, service, composant) : utilisé par **une seule** feature, il reste dans le dossier de cette feature ; utilisé par **plus d'une** feature, il va dans `shared/` (ex. : `shared/utils/models/entreprise.ts`). On le déplace dans `shared/` dès qu'une deuxième feature en a besoin.
- **Aucune dépendance entre features** : une feature n'importe jamais rien d'une autre feature, seulement de `shared/` et `layout/`. Comme pour les modules autrefois, et pour respecter plus tard les contraintes de dépendances de Nx (une librairie par feature, sans interdépendance).
- **`shared/`** : n'importe jamais une feature.
- **Smart** (`*-page`) : seuls composants à injecter des services, ceux de leur feature ou de `shared/`. Croisent les données si besoin, les passent aux dumb et réagissent à leurs événements.
- **Dumb** : aucun service, aucun router, aucun HTTP. Reçoit via `input()`, émet via `output()`.
- **Service** : n'injecte jamais le service d'une autre feature (s'il en a besoin, ce service partagé va dans `shared/`). Jamais fourni ni référencé dans `app.config.ts` (bundle initial) : `@Service()` suffit.
- On n'importe jamais un composant (smart ou dumb) d'une autre feature. Règles complètes : `documentation.md`, section 1.1.
- Pas de composant sans comportement : un titre ou un conteneur simple reste du HTML.

## Angular 22 : API à utiliser

Pour les données (services et pages), les lignes `signal()` / `BehaviorSubject` et `httpResource()` ne s'appliquent qu'à partir de l'étape 3 de la progression ci-dessus. Les autres lignes s'appliquent dès le début.

| À utiliser | Plutôt que |
|---|---|
| `@Service()` | `@Injectable({ providedIn: 'root' })` |
| `inject()` | injection par le constructeur |
| `input()`, `output()`, `model()` | `@Input()`, `@Output()` |
| `signal()`, `computed()`, `linkedSignal()` | propriétés mutables, `BehaviorSubject` |
| `@if`, `@for` (avec `track`), `@switch`, `@let` | `*ngIf`, `*ngFor`, `*ngSwitch` |
| `httpResource()` / `resource()` pour lire des données | `subscribe` manuel dans le composant |
| Signal Forms (`@angular/forms/signals`) | formulaires réactifs classiques |
| `host: {}` dans `@Component` | `@HostBinding`, `@HostListener` |
| `[class.x]`, `[style.x]` | `ngClass`, `ngStyle` |
| OnPush (défaut), zoneless | `zone.js`, `ChangeDetectionStrategy.Default` |

Pas de `NgModule`.

## Styles et Bootstrap

- **Pas de SCSS, pas de variables de thème** : uniquement du CSS. Bootstrap est utilisé tel quel, avec son thème par défaut.
- Bootstrap est importé **une seule fois**, en CSS précompilé, dans le tableau `styles` de `angular.json` (`node_modules/bootstrap/dist/css/bootstrap.min.css`, avant `src/styles.css`). Jamais réimporté dans un composant (tout son CSS serait copié dans le composant).
- **Classes Bootstrap au maximum, CSS custom au minimum.** On met en forme avec les classes Bootstrap dans le template : composants (`btn btn-primary`, `form-control`, `form-label`, `table`, `badge`, `card`, `alert`), mise en page (`container`, `row`, `col-*`, `d-flex`, `gap-*`, `justify-content-*`), espacements (`p-*`, `m-*`), texte et couleurs (`fw-bold`, `text-secondary`, `bg-primary`), bordures (`border`, `rounded`), tailles et position (`w-100`, `vh-100`, `position-*`, `shadow`). Avant d'écrire une règle CSS, vérifier qu'aucune classe Bootstrap ne le fait déjà.
- Le `.css` d'un composant reste vide par défaut. On n'y écrit que ce que Bootstrap ne sait vraiment pas faire (ex. : un positionnement propre au composant). Si une couleur y est nécessaire, on reprend une variable déjà fournie par Bootstrap (`var(--bs-primary)`…) plutôt qu'une couleur en dur, sans créer de variable.
- **Design de référence** : les premiers écrans (00 à 06 : Connexion, AppHeader, ListPageLayout, Panneau entreprise, Contacts, Popup contact) de `.claude/support-cours.html`, reproduits avec les couleurs par défaut de Bootstrap.
- Couleurs : `primary` = action principale, `dark` = header, titres, filtre actif, `secondary` = gris.
- Statuts : `success` = Gagné / Actif, `secondary` = Inactif, `info` = Prospect, `warning` = En cours, `danger` = Perdu. Une pastille de statut ou un avatar s'écrit `bg-*-subtle text-*-emphasis` (ex. : `badge rounded-pill bg-success-subtle text-success-emphasis`), qui respecte le contraste.
- Polices : Nunito pour le texte, Poppins pour les titres et les boutons (chargées dans `index.html`).

## Code simple et lisible

- Le code le plus direct qui marche. Pas d'abstraction, de généricité ou de pattern « au cas où ».
- Une idée par fonction, des fonctions courtes.
- RxJS : reste sur les opérateurs de base (`map`, `switchMap`, `catchError`, `tap`). À partir de l'étape 3, évite RxJS quand un signal suffit.
- Pas d'astuce TypeScript avancée (types conditionnels, génériques complexes).
- Ajoute un commentaire seulement si le « pourquoi » n'est pas évident, jamais pour paraphraser le code.

## Clean code

- Noms explicites et en français pour le métier (`entreprises`, `enregistrer()`), sans abréviations.
- Booléens nommés comme des questions : `isLogged`, `hasError`.
- Une responsabilité par fichier, par composant, par fonction.
- Pas de code mort, pas de `console.log` laissé, pas de valeurs magiques (constantes nommées).
- Typage strict : pas de `any`. Interfaces/types des entités dans `<feature>/utils/models/`, ou dans `shared/utils/models/` si plusieurs features les utilisent.
- `readonly` sur les propriétés qui ne sont pas réassignées, `protected` pour ce qui n'est utilisé que par le template.
- Retours anticipés plutôt que des `if` imbriqués.

## Accessibilité (obligatoire, sans qu'on le demande)

- HTML sémantique : `<button>` pour une action, `<a routerLink>` pour une navigation, `<main>`, `<nav>`, `<header>`, titres `h1` → `h2` sans sauter de niveau.
- Chaque champ a un `<label for>` associé. Erreurs reliées par `aria-describedby`, champ invalide signalé par `aria-invalid`.
- Tout est utilisable au clavier, avec un focus visible (ne jamais supprimer `outline` sans le remplacer).
- Modales et panneaux : focus déplacé à l'ouverture, piégé dedans, rendu à l'élément d'origine à la fermeture, fermeture par Échap, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Bouton icône seul : `aria-label`. Image décorative : `alt=""`, image informative : `alt` descriptif.
- Messages dynamiques (succès, erreur, chargement) annoncés via `aria-live="polite"` (ou `role="alert"` pour une erreur).
- Contraste WCAG AA (4,5:1 pour le texte). L'information ne passe jamais par la couleur seule.
- ARIA uniquement quand le HTML natif ne suffit pas.

## Tests unitaires (Vitest)

- Un fichier `.spec.ts` à côté de chaque composant et service.
- Teste le comportement visible, pas l'implémentation : ce qui s'affiche, ce qui est émis, ce qui est appelé.
- Structure Arrange / Act / Assert, un comportement par test, noms de tests en français qui décrivent le comportement (`it('affiche une erreur si l'e-mail est vide')`).
- **Dumb** : fixe les inputs avec `fixture.componentRef.setInput()`, vérifie le rendu et les `output()` émis.
- **Smart** : remplace le service par un faux via `providers: [{ provide: XService, useValue: ... }]`.
- **Service** : `provideHttpClient()` + `provideHttpClientTesting()`, vérifie les requêtes avec `HttpTestingController` et termine par `httpTesting.verify()`.
- Sélectionne les éléments par rôle, libellé ou texte, pas par classe CSS.
- `await fixture.whenStable()` après une action (zoneless).
- Tests indépendants : pas d'état partagé entre deux tests.

## Tests e2e (Playwright)

- Teste les parcours utilisateur complets (connexion, créer une entreprise, modifier une opportunité…), pas les détails déjà couverts en unitaire.
- Localisateurs accessibles en priorité : `getByRole`, `getByLabel`, `getByText`. `getByTestId` en dernier recours. Jamais de sélecteur CSS ou XPath fragile.
- Assertions web-first qui attendent automatiquement : `await expect(locator).toBeVisible()`, `toHaveText`, `toHaveURL`. Jamais de `waitForTimeout`.
- Chaque test est indépendant : il prépare ses propres données et ne dépend pas de l'ordre d'exécution.
- Connexion factorisée : `storageState` via un projet `setup`, ou une fixture, plutôt que se reconnecter dans chaque test.
- `page.route()` pour simuler l'API quand on teste le frontend seul.
- Regroupe avec `test.describe`, prépare avec `test.beforeEach`, noms de tests en français.
- Page Object seulement si un écran est réutilisé dans plusieurs fichiers de test (rester simple).
- Vérifie l'accessibilité des pages principales avec `@axe-core/playwright`.

## Conventions

- Nommage Angular v20+ : pas de suffixe `Component` / `.component` (`AuthPage` dans `auth-page.ts`).
- Fichiers séparés `.ts` / `.html` / `.css` / `.spec.ts` par composant.
- Préfixe des sélecteurs : `app-`.
- Routes dans `src/app/app.routes.ts`, pages chargées en lazy loading (`loadComponent` / `loadChildren`).
