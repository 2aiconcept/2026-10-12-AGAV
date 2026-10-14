# Documentation du mini-CRM

Documentation de toute l'application, mise à jour à chaque ajout ou modification de code. Elle décrit le code **tel qu'il est aujourd'hui**.

## 1. Architecture

### 1.1 Règles de dépendances

```
src/app/
  <feature>/            # auth, entreprises, contacts, opportunites
    data-access/        # service de la feature (HTTP + état en signals)
    smart-components/   # pages routées (*-page)
    dump-components/    # composants de présentation (input()/output())
    utils/models/       # interfaces propres à la feature
  shared/               # ce qui sert à plus d'une feature
  layout/               # structure commune des pages (header, mise en page)
```

| Depuis…   | Peut importer                                   | Ne peut pas importer         |
| --------- | ----------------------------------------------- | ---------------------------- |
| Feature   | sa propre feature, `shared/`, `layout/`         | une autre feature            |
| `shared/` | `shared/`                                       | une feature                  |
| `layout/` | `layout/`, `shared/`                            | une feature                  |
| Smart     | services de sa feature ou de `shared/`, dumb    | services d'une autre feature |
| Dumb      | rien d'injecté (ni service, ni router, ni HTTP) | —                            |

Un élément utilisé par une seule feature reste dans cette feature. Il passe dans `shared/` dès qu'une deuxième feature en a besoin.

**Écart actuel avec cette cible** : les dossiers du code s'appellent `Feature-<feature>/` (au lieu de `<feature>/`), `pages/` (au lieu de `smart-components/`) et `ui/` (au lieu de `dump-components/`), `models/` (au lieu de `utils/models/`). `Feature-not-found/` existe en plus des quatre features. Il n'y a pas encore de dossier `layout/` : `app-shell`, `header`, `nav`, `logo`, `button-small`, `badge-utilisateur`, `pipes`, `layout-pages`, `layout-slice` et `layout-top-bottom` sont dans `shared/`. Enfin, `shared/header`, `shared/jwt-interceptor` et `shared/errors-interceptor` importent `AuthService` de la feature auth (dépendance `shared/` → feature interdite par la règle ci-dessus, assumée provisoirement). Via les intercepteurs, `AuthService` est donc aussi référencé depuis `app.config.ts` et chargé dans le bundle initial.

### 1.2 Démarrage de l'application

- `src/main.ts` : `bootstrapApplication(App, appConfig)`, sans NgModule.
- `src/app/app.config.ts` : providers globaux (`provideRouter`, `provideBrowserGlobalErrorListeners`, `provideHttpClient(withInterceptors([jwtInterceptor, errorsInterceptor]))`). Aucun service de feature n'y est fourni.
- `src/app/app.ts` : composant racine `App`. `app.html` n'affiche que `<router-outlet>` (le header et une démonstration de `<app-layout-pages>` y sont en commentaire). Le header est affiché par `AppShell`, sur les pages connectées seulement (voir section 2).
- Environnements : `src/environments/environment.ts` (développement, `production: false`) et `environment.prod.ts` (`production: true`). Les deux exposent `apiBaseUrl` (aujourd'hui la même URL d'API). Au build de production, `angular.json` remplace le premier par le second (`fileReplacements`). Le code importe toujours `environments/environment` (`AuthService`, `jwtInterceptor`).
- Styles : `src/styles.css`, qui charge le CSS précompilé de Bootstrap une seule fois (`@import 'bootstrap/dist/css/bootstrap.min.css'`). `angular.json` ne référence que `src/styles.css`.

## 2. Routes

Déclarées dans `src/app/app.routes.ts`. Les pages sont chargées en lazy loading (`loadComponent`, ou `loadChildren` pour une feature à plusieurs pages) et exportées par défaut (`export default class`). Chaque page a un `title` (titre de l'onglet, annoncé par les lecteurs d'écran).

Deux familles de pages :
- **hors coque** : `/connexion` et la page introuvable, affichées seules (sans header) ;
- **dans la coque `AppShell`** : la route `''` affiche `AppShell` (chargé directement, pas en lazy loading), qui contient le header et un `<router-outlet>` enfant pour les pages de l'application.

| Chemin                | Composant            | Feature        | Guard | Description                          |
| --------------------- | -------------------- | -------------- | ----- | ------------------------------------ |
| `connexion`           | `PageAuth`           | auth           | —     | Connexion (hors coque)               |
| `''`                  | `AppShell`           | shared         | —     | Coque : header + pages enfants ci-dessous |
| `''` (enfant)         | —                    | —              | —     | Redirige vers `entreprises`          |
| `entreprises`         | `PageEntreprises`    | entreprises    | —     | Liste des entreprises                |
| `contacts`            | `PageContacts`       | contacts       | —     | Liste des contacts (`contacts.routes.ts`) |
| `contacts/ajouter`    | `PageAjouterContact` | contacts       | —     | Création d'un contact                |
| `contacts/editer/:id` | `PageEditerContact`  | contacts       | —     | Modification d'un contact            |
| `opportunites`        | `PageOpportunites`   | opportunites   | —     | Liste des opportunités               |
| `**`                  | `PageNotFound`       | not-found      | —     | Page introuvable (hors coque)        |

Les routes de la feature contacts sont dans `src/app/Feature-contacts/contacts.routes.ts`, exportées par défaut et chargées par `loadChildren`.

## 2 bis. API

Détail complet (tous les endpoints, corps envoyés et reçus, erreurs, modèles) : **`.claude/endpoints-et-donnees.md`**, tiré du Swagger (`https://mini-crm-api-jwt-production.up.railway.app/api-docs/`).

En résumé :
- URL : `environment.apiBaseUrl` = `https://mini-crm-api-jwt-production.up.railway.app/api`.
- Auth JWT : `POST /auth/login` et `POST /auth/register` renvoient `{ token, user }`. Les autres routes exigent `Authorization: Bearer <token>`. `GET /auth/profile` renvoie l'utilisateur connecté.
- CRUD complet (`GET` liste, `GET /{id}`, `POST`, `PUT /{id}` partiel, `DELETE /{id}`) sur `/entreprises`, `/contacts` et `/opportunites`. Plus `GET /entreprises/{id}/contacts`, `GET /contacts/{id}/opportunites` et `GET /dashboard/stats`.
- Modèles : `Entreprise`, `Contact` (`entreprise_id`), `Opportunite` (`contact_id`, `entreprise_id`, `statut` : `Prospect` | `En cours` | `Gagne` | `Perdu`), `UserProfile` (`id`, `email`, `nom`, `prenom`, `role`).
- Comptes de démo : `user@test.com` / `password123`, `admin@test.com` / `admin123`.

## 3. Features

<!--
Modèle de fiche, à recopier pour chaque élément :

#### NomDuComposant (`chemin/du/fichier.ts`)
- **Type** : smart | dumb | service | modèle | guard | interceptor
- **Rôle** : à quoi il sert, en une phrase.
- **Entrées** : input() / paramètres de route / données lues dans le service.
- **Sorties** : output() / méthodes publiques du service / navigation.
- **Utilisé par** : composants ou routes qui s'en servent.
-->

Sauf mention contraire (voir `PageAuth`, `Nav`, `Logo`, `ButtonSmall`, `BadgeUtilisateur`, `Header`, `AppShell`, `LayoutSlice`, `LayoutTopBottom` et `LayoutPages`), les composants ci-dessous sont des squelettes générés par le CLI : template `<p>… works!</p>`, sans input, output ni logique. Les fiches seront complétées quand ils auront un comportement.

### 3.1 auth

> **Écriture « classique » pour les échanges HTTP.** La feature auth sert d'exemple : `HttpClient` qui renvoie des `Observable`, pipe `async` dans la page, formulaire réactif avec `FormBuilder`. Les autres formulaires utiliseront les Signal Forms. Seule la **session** est passée en `signal()` (exercice : elle était d'abord dans un `BehaviorSubject`, voir le support de cours 4.5). Le reste sera basculé en signals plus tard (étape 3).

#### PageAuth (`Feature-auth/pages/page-auth/page-auth.ts`)
- **Type** : smart
- **Rôle** : page de connexion et d'inscription, en deux colonnes avec `LayoutSlice`.
  - Colonne gauche (`slotStart`) : `<app-logo>` en haut, au centre (`my-auto`) l'accroche « Mini-CRM », le titre `h1` et l'invitation, en bas le copyright. Couleurs du thème sombre de la colonne (`text-body-secondary`, `text-primary-emphasis`).
  - Colonne droite (`slotEnd`) : un `<main>` qui contient `<app-form-auth>`.
- **Entrées** : événements `connexion` (`Login`) et `inscription` (`Register`) de `FormAuth`.
- **Fonctionnement** : `seConnecter()` / `creerUnCompte()` affectent `envoi$` (`Observable<ResultatEnvoi>`), construit à partir de l'observable du service : `tap` (navigation vers `/entreprises` en cas de succès), `map` (`{ erreur: null }`), `catchError` (message d'erreur lisible). La requête part quand le pipe `async` du template s'abonne (`@let resultat = envoi$ | async`). Chaque nouvel envoi remplace `envoi$` : le pipe `async` se désabonne de l'ancien. Pendant l'attente (`envoi$` défini et `resultat` encore `null`), `FormAuth` reçoit `isEnvoiEnCours = true`.
- **Messages d'erreur** : 401 → « E-mail ou mot de passe incorrect. » ; 400 → message `error` de l'API (ex. e-mail déjà utilisé) ; 0 → serveur injoignable ; autre → message générique.
- **Sorties** : navigation vers `/entreprises` après connexion ou inscription réussie.
- **Utilisé par** : route `connexion`.

#### FormAuth (`Feature-auth/ui/form-auth/form-auth.ts`)
- **Type** : dumb (formulaire réactif : `ReactiveFormsModule` + `NonNullableFormBuilder`, outil de formulaire et non service de données)
- **Rôle** : formulaire conforme à la maquette, en deux modes :
  - **connexion** : e-mail, mot de passe ;
  - **inscription** : prénom, nom, e-mail, mot de passe.
  On change de mode avec les deux onglets (boutons `aria-pressed`) ou le lien du bas. Le mode et l'affichage du mot de passe sont un état d'affichage, en `signal()`.
- **Formulaire** : un seul `FormGroup`. `prenom` et `nom` sont désactivés en mode connexion, donc ignorés par la validation. Validateurs : `required` partout, `email`, `minLength(6)` sur le mot de passe.
- **Accessibilité** : `<label for>` sur chaque champ, erreurs affichées après le passage dans le champ (`touched`) ou à l'envoi (`markAllAsTouched`), reliées par `aria-describedby`, `aria-invalid`. Bouton « Afficher / Masquer le mot de passe » (`aria-pressed`, `aria-controls`). Erreur serveur en `role="alert"`, envoi en cours annoncé par `aria-live`. `autocomplete` adapté au mode.
- **Entrées** : `erreur` (`input<string | null>`, message à afficher), `isEnvoiEnCours` (`input<boolean>` : bouton désactivé + spinner).
- **Sorties** : `connexion` (`output<Login>`), `inscription` (`output<Register>`), émis seulement si le formulaire est valide.
- **Style** : classes Bootstrap ; `form-auth.css` limite seulement la largeur (`:host`, `max-width: 28rem`).
- **Utilisé par** : `PageAuth`.

#### AuthService (`Feature-auth/data-access/auth-service.ts`)
- **Type** : service (`@Service()`). Requêtes en observables, session en signal.
- **Rôle** : appels HTTP d'authentification et session de l'utilisateur.
- **Méthodes** (observables froids : la requête ne part qu'à l'abonnement) :
  - `connexion(identifiants: Login): Observable<User>` : `POST /auth/login`.
  - `creerUnCompte(register: Register): Observable<User>` : `POST /auth/register`.
  - Les deux enregistrent la session reçue au passage (`tap`), seulement en cas de succès.
  - `deconnexion(): void` : efface la session.
- **État** : `session` (`Signal<User | null>`, lecture seule), exposé par `asReadonly()` d'un `signal()` privé que seul le service modifie (`set()`). Initialisé au démarrage depuis le `localStorage` (clé `mini-crm.session`, JSON illisible ignoré). Lu par le header et par `jwtInterceptor` (`session()`) ; servira aussi au guard.
- **Utilisé par** : `PageAuth` (`connexion`, `creerUnCompte`), `Header` (`session`, `deconnexion`), `jwtInterceptor` (`session`), `errorsInterceptor` (`deconnexion`).

#### Login (`Feature-auth/models/login.ts`)
- **Type** : modèle (interface)
- **Rôle** : identifiants envoyés à `POST /auth/login` (`LoginInput` de l'API) : `email`, `password`.
- **Utilisé par** : `AuthService.connexion()`, `FormAuth`, `PageAuth`.

#### Register (`Feature-auth/models/register.ts`)
- **Type** : modèle (interface)
- **Rôle** : données envoyées pour créer un compte (`RegisterInput` de l'API) : `email`, `password` (6 caractères minimum), `nom`, `prenom`, tous obligatoires.
- **Utilisé par** : `AuthService.creerUnCompte()`, `FormAuth`, `PageAuth`.

#### User (`Feature-auth/models/user.ts`)
- **Type** : modèle (interface)
- **Rôle** : session renvoyée par l'API après connexion ou inscription (`AuthResponse`) : `token` (JWT) et `user` (`id`, `email`, `nom`, `prenom`, `role`). C'est aussi ce qui est stocké dans le `localStorage`.
- **Utilisé par** : `AuthService`, `PageAuth`.

#### ResultatEnvoi (`Feature-auth/models/resultat-envoi.ts`)
- **Type** : modèle (interface)
- **Rôle** : résultat d'un envoi du formulaire vu par la page : `erreur` (`string | null`).
- **Utilisé par** : `PageAuth`.

### 3.2 entreprises

> **Étape 3, API seule source de vérité** : l'application est multi-utilisateur, donc aucune donnée n'est gardée en local. La **liste** est lue avec `httpResource()` (signals `value()`, `isLoading()`, `error()`, `hasValue()`, `reload()`). Les **écritures** (`creer`, `modifier`, `supprimer`) et `trouver` passent par `HttpClient` + `firstValueFrom` (des `Promise`, avec `async/await`). Après chaque écriture, la page relit la liste sur l'API avec `reload()` : on ne met jamais à jour une liste à la main. Les versions `Observable` d'origine sont gardées en commentaire dans le service.

#### PageEntreprises (`Feature-entreprises/pages/page-entreprises/page-entreprises.ts`)
- **Type** : smart
- **Rôle** : liste des entreprises dans `LayoutPages`. En-tête (`pageHeader`, `d-flex justify-content-between`) : « Portefeuille commercial » et le titre `h1` « Entreprises » à gauche, à droite le lien-bouton « + Ajouter une entreprise » (`<a routerLink="/entreprises/ajouter">`, `btn btn-primary rounded-pill`). Route et page de création pas encore créées : le lien mène pour l'instant à la page introuvable. Contenu : tableau Bootstrap (`table table-hover`, `<caption>` masquée pour les lecteurs d'écran, `<th scope="col">`) avec nom + adresse, secteur, téléphone et une colonne **Actions**. Pied (`pageFooter`) : nombre d'entreprises affichées.
- **Données** : `entreprises = entreprisesService.lister()`, une ressource HTTP créée à l'initialisation de la page (contexte d'injection) : la requête part tout de suite, sans abonnement. Le template lit ses signals, dans cet ordre : `error()` → alerte « Impossible de charger les entreprises. » (`role="alert"`) ; `hasValue()` → tableau avec `value()` ; sinon « Chargement des entreprises… » (`aria-live`). Liste vide : « Aucune entreprise. » (`@empty`). On ne lit jamais `value()` sans avoir testé `hasValue()` (lire `value()` en erreur lève une exception).
- **Actions par ligne** :
  - **Modifier** : lien `<a routerLink>` vers `/entreprises/{id}/modifier` (route et page pas encore créées : mène pour l'instant à la page introuvable).
  - **Supprimer** : bouton qui demande une confirmation (`confirm()`), attend `EntreprisesService.supprimer(id)` (`await`), puis relit la liste sur l'API avec `entreprises.reload()`. Pendant le rechargement, l'ancienne liste reste affichée (`hasValue()` reste vrai). Si la suppression échoue, la promesse est rejetée : pas de rechargement, et l'erreur part au gestionnaire d'erreurs global (un 401 est traité par `errorsInterceptor`).
  - Le nom de l'entreprise est ajouté en texte masqué (`visually-hidden`) dans chaque lien et bouton : « Modifier TechVision », « Supprimer TechVision ».
- **Pas encore** : pages de création et de modification, recherche.
- **Utilisé par** : route `entreprises`.

#### EntreprisesService (`Feature-entreprises/data-access/entreprises-service.ts`)
- **Type** : service (`@Service()`).
- **Rôle** : CRUD des entreprises sur `${environment.apiBaseUrl}/entreprises`, **sans aucun état** (pas de signal, pas de liste en mémoire) : l'API est la seule source de vérité. La lecture de la liste est une ressource HTTP (signals) ; les autres méthodes renvoient une `Promise` (`firstValueFrom`), qui s'abonne tout de suite : la requête part dès l'appel. Le token est ajouté par `jwtInterceptor`.
- **Méthodes** :
  - `lister(): HttpResourceRef<Entreprise[] | undefined>` : `GET /entreprises` avec `httpResource()`. La requête part dès la création. **À appeler dans un contexte d'injection** (initialisation d'une propriété de composant). L'ancienne version (`Observable` + `http.get`) est gardée en commentaire dans le fichier, pour la comparaison.
  - `trouver(id): Promise<Entreprise>` : `GET /entreprises/{id}`.
  - `creer(entreprise: EntrepriseInput): Promise<Entreprise>` : `POST /entreprises`, renvoie l'entreprise créée par l'API.
  - `modifier(id, entreprise: EntrepriseInput): Promise<Entreprise>` : `PUT /entreprises/{id}` (mise à jour partielle côté API), renvoie l'entreprise modifiée.
  - `supprimer(id): Promise<void>` : `DELETE /entreprises/{id}`.
  - En cas d'erreur HTTP, la promesse est rejetée avec la `HttpErrorResponse`.
- **Utilisé par** : `PageEntreprises` (`lister`, `supprimer`). `trouver`, `creer` et `modifier` ne sont pas encore appelées.

#### Entreprise (`Feature-entreprises/models/entreprise.ts`)
- **Type** : modèle (interface)
- **Rôle** : entreprise renvoyée par l'API : `id`, `nom`, `secteur?`, `adresse?`, `telephone?`.
- **Utilisé par** : `EntreprisesService`, `PageEntreprises`.

#### EntrepriseInput (`Feature-entreprises/models/entreprise-input.ts`)
- **Type** : modèle (type utilitaire `Omit<Entreprise, 'id'>`)
- **Rôle** : données envoyées pour créer ou modifier une entreprise : les champs d'`Entreprise` sans `id` (`nom` obligatoire, `secteur?`, `adresse?`, `telephone?`). Suit automatiquement les changements d'`Entreprise`.
- **Utilisé par** : `EntreprisesService.creer()` et `modifier()`.

### 3.3 contacts

Routes de la feature : `Feature-contacts/contacts.routes.ts` (voir section 2).

#### PageContacts (`Feature-contacts/pages/page-contacts/page-contacts.ts`)
- **Type** : smart
- **Rôle** : liste des contacts.
- **Utilisé par** : route `contacts`.

#### PageAjouterContact (`Feature-contacts/pages/page-ajouter-contact/page-ajouter-contact.ts`)
- **Type** : smart
- **Rôle** : création d'un contact.
- **Utilisé par** : route `contacts/ajouter`.

#### PageEditerContact (`Feature-contacts/pages/page-editer-contact/page-editer-contact.ts`)
- **Type** : smart
- **Rôle** : modification d'un contact.
- **Entrées** : paramètre de route `:id` (pas encore lu).
- **Utilisé par** : route `contacts/editer/:id`.

#### FormContact (`Feature-contacts/ui/form-contact/form-contact.ts`)
- **Type** : dumb
- **Rôle** : formulaire de contact, prévu pour la création et la modification (à venir).
- **Utilisé par** : personne pour l'instant.

### 3.4 opportunites

#### PageOpportunites (`Feature-opportunites/pages/page-opportunites/page-opportunites.ts`)
- **Type** : smart
- **Rôle** : liste des opportunités.
- **Utilisé par** : route `opportunites`.

### 3.5 not-found

#### PageNotFound (`Feature-not-found/pages/page-not-found/page-not-found.ts`)
- **Type** : smart
- **Rôle** : page affichée pour une URL inconnue.
- **Utilisé par** : route `**`.

## 4. Shared

#### Header (`shared/header/header.ts`)
- **Type** : composant qui injecte des services (`AuthService`, `Router`). Importe aussi la directive `RouterLink` et les composants `Logo`, `Nav`, `BadgeUtilisateur` et `ButtonSmall`.
- **Rôle** : bandeau en haut de l'application (`<header>`, `bg-dark`). De gauche à droite : `<app-logo>` dans un lien vers `/entreprises`, le menu `<app-nav>` (qui prend la place libre avec `flex-grow-1`), puis, **seulement s'il y a une session**, `<app-badge-utilisateur>` (`session.user`) et le bouton « Déconnexion » (`<app-button-small>`, contour `light`).
- **Données** : `@if (authService.session(); as session)` (lecture du signal, sans pipe `async`). Le badge et le bouton apparaissent ou disparaissent dès que la session change (connexion, déconnexion).
- **Déconnexion** : `logout()` appelle `AuthService.deconnexion()` puis navigue vers `/connexion`.
- **Écart d'architecture assumé** : `Header` est dans `shared/` mais importe `AuthService` de la feature auth, et injecte un service alors qu'il est dans `shared/` (voir 1.1). C'est un choix de simplicité pour la formation, à corriger plus tard : session dans un service de `shared/`, ou données passées par `AppShell`.
- **Style** : uniquement des classes Bootstrap, `header.css` est vide.
- **Entrées / sorties** : aucune.
- **Utilisé par** : `AppShell` (donc sur les pages de l'application, pas sur la connexion).

#### AppShell (`shared/app-shell/app-shell.ts`)
- **Type** : coque de mise en page routée (n'injecte rien)
- **Rôle** : affiche `<app-header>` puis un `<main>` qui contient un `<router-outlet>` pour les pages enfants (entreprises, contacts, opportunités). Permet d'avoir le header sur ces pages et pas sur `/connexion`.
- **Entrées / sorties** : aucune.
- **Utilisé par** : route `''` de `app.routes.ts` (chargée directement, pas en lazy loading).

#### ButtonSmall (`shared/button-small/button-small.ts`)
- **Type** : dumb
- **Rôle** : bouton en pilule (`btn rounded-pill`), `type="button"`, avec une icône facultative devant le libellé. Fond plein (`btn-<couleur>`) ou contour seul (`btn-outline-<couleur>`). L'icône est un caractère (ex. : `+`, `✎`), masqué aux lecteurs d'écran (`aria-hidden`).
- **Entrées** (signal inputs) :
  - `libelle` (`input.required<string>()`) : texte du bouton.
  - `icone` (`input<string>()`, facultatif) : caractère affiché devant le libellé.
  - `couleur` (`input<CouleurBootstrap>()`, défaut `'primary'`) : couleur Bootstrap.
  - `btnSize` (`input<string>()`, défaut `'btn-md'`) : classe de taille ajoutée au bouton (`btn-sm`, `btn-lg`). `btn-md` n'existe pas dans Bootstrap : par défaut, le bouton a donc la taille normale.
  - `isOutline` (`input(false)` avec `booleanAttribute`) : contour seul si vrai. On peut écrire l'attribut sans valeur (`isOutline`).
- **Sorties** : `action` (`output<void>()`), émis au clic. Ce nom ne ressemble pas à un événement du DOM (`click`) : `(action)` vient forcément du composant.
- **Utilisé par** : `Header` (bouton « Déconnexion »).

#### BadgeUtilisateur (`shared/badge-utilisateur/badge-utilisateur.ts`)
- **Type** : dumb
- **Rôle** : affiche un utilisateur : avatar rond avec ses initiales (pipe `initiales`, masqué aux lecteurs d'écran) et son prénom + nom à côté. Le nom complet est calculé une fois dans le template avec `@let`.
- **Style** : avatar en `bg-primary-subtle text-primary-emphasis`. Seule règle CSS : `.avatar` (taille fixe du cercle) dans `badge-utilisateur.css`.
- **Entrées** : `utilisateur` (`input.required<Utilisateur>()`).
- **Sorties** : aucune.
- **Utilisé par** : `Header`.

#### InitialesPipe (`shared/pipes/initiales-pipe.ts`)
- **Type** : pipe pur, nom `initiales`
- **Rôle** : transforme un nom complet en initiales majuscules, 2 au plus (`'Chris Martin'` → `'CM'`). Ignore les espaces en trop, renvoie `''` pour un nom vide.
- **Utilisé par** : `BadgeUtilisateur`. Prévu aussi pour les avatars des listes (contacts…).

#### Utilisateur (`shared/utils/models/utilisateur.ts`)
- **Type** : modèle (interface)
- **Rôle** : `prenom`, `nom`. Sous-ensemble du `UserProfile` de l'API (`id`, `email`, `nom`, `prenom`, `role`) : à compléter quand la feature auth branchera l'utilisateur connecté.
- **Utilisé par** : `BadgeUtilisateur`, `Header`.

#### CouleurBootstrap (`shared/utils/models/couleur-bootstrap.ts`)
- **Type** : modèle (type union)
- **Rôle** : les 8 couleurs du thème Bootstrap (`primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`). Empêche de passer une couleur inexistante.
- **Utilisé par** : `ButtonSmall`.

#### Logo (`shared/logo/logo.ts`)
- **Type** : dumb (visuel seul, sans lien ni logique)
- **Rôle** : affiche le logo de la marque : la lettre « l » dans un carré `bg-primary` et le nom « liane » suivi d'un point `text-primary`. La lettre et le point sont décoratifs (`aria-hidden`). Prévu pour un fond sombre (texte blanc). Le lien éventuel est posé par le parent, pour réutiliser le logo là où il ne doit pas être cliquable (ex. : page de connexion).
- **Entrées / sorties** : aucune.
- **Utilisé par** : `Header` (dans un `<a routerLink="/entreprises">`), `PageAuth` (non cliquable).

#### Nav (`shared/nav/nav.ts`)
- **Type** : dumb (n'injecte rien : utilise seulement les directives `RouterLink` et `RouterLinkActive` dans le template)
- **Rôle** : navigation principale (`<nav aria-label="Navigation principale">`), avec des liens vers `/entreprises`, `/contacts` et `/opportunites` (liste `nav` Bootstrap, conçue pour un fond sombre). Liens inactifs : `link-light link-opacity-75`. Lien de la page courante : `routerLinkActive` ajoute `bg-white bg-opacity-10 link-opacity-100 fw-semibold`, et `aria-current="page"` (`ariaCurrentWhenActive`).
- **Entrées / sorties** : aucune.
- **Utilisé par** : `Header`.

#### LayoutPages (`shared/layout-pages/layout-pages.ts`)

> **Issu d'un exercice** : ce composant est un corrigé d'exercice, désormais utilisé par `PageEntreprises`. Il peut encore évoluer.

- **Type** : dumb (mise en page par projection de contenu)
- **Rôle** : cadre commun des pages de liste (entreprises, contacts, opportunités). C'est une carte Bootstrap (`card shadow-sm`) dans un `container`, découpée en quatre zones séparées par une bordure : en-tête, barre d'outils, contenu (`card-body p-3`) et pied de page. Ne pose aucun repère (`<main>`…).
- **Entrées** : quatre `ng-content`, dans cet ordre d'affichage : `[pageHeader]` (titre et action principale), `[pageToolbar]` (recherche, filtres), contenu par défaut (tout ce qui n'a pas d'attribut de slot, ex. : le tableau), `[pageFooter]` (compteur, pagination). Une zone sans contenu reste affichée, vide.
- **Sorties** : aucune.
- **Utilisé par** : `PageEntreprises`. (Encore importé dans `App`, où la démonstration est en commentaire.)

#### LayoutSlice (`shared/layout-slice/layout-slice.ts`)
- **Type** : dumb (mise en page par projection de contenu)
- **Rôle** : coupe l'écran en deux colonnes sur toute la hauteur (`min-vh-100`) : à gauche un panneau sombre (`bg-dark text-white`, en colonne flex, avec `data-bs-theme="dark"` : les utilitaires `text-body-secondary`, `text-*-emphasis`… y prennent leurs couleurs lisibles sur fond sombre), à droite un panneau clair (`bg-body-tertiary`) qui centre son contenu. Les colonnes s'empilent sous le breakpoint `md`. Ne pose aucun repère (`<main>`…) : c'est à la page de le faire.
- **Entrées** : deux `ng-content` : `[slotStart]` (colonne de gauche) et `[slotEnd]` (colonne de droite). Un contenu sans l'un de ces attributs n'est pas affiché.
- **Sorties** : aucune.
- **Utilisé par** : `PageAuth`.

#### LayoutTopBottom (`shared/layout-top-bottom/layout-top-bottom.ts`)
- **Type** : dumb (mise en page par projection de contenu)
- **Rôle** : même principe que `LayoutSlice`, mais en deux blocs empilés sur toute la largeur, sur la hauteur de l'écran (`vh-100`) : en haut un bloc sombre (`bg-dark text-white`, en colonne flex), en bas un bloc clair (`bg-body-tertiary`) qui centre son contenu. Chaque bloc prend 50 % de la hauteur (`h-50`) et défile si son contenu dépasse (`overflow-auto`). Ne pose aucun repère (`<main>`…).
- **Entrées** : deux `ng-content`, avec les mêmes attributs que `LayoutSlice` : `[slotStart]` (bloc du haut) et `[slotEnd]` (bloc du bas). Un contenu sans l'un de ces attributs n'est pas affiché.
- **Sorties** : aucune.
- **Utilisé par** : personne pour l'instant.

#### jwtInterceptor (`shared/jwt-interceptor.ts`)
- **Type** : interceptor fonctionnel (`HttpInterceptorFn`)
- **Rôle** : ajoute `Authorization: Bearer <token>` aux requêtes HTTP, en lisant le token de la session (`inject(AuthService).session()?.token`) au moment de chaque requête. La requête est clonée (`req.clone`), car elle est immuable.
- **Règles** : rien n'est ajouté sans session, ni pour une URL qui ne commence pas par `environment.apiBaseUrl` (le token ne part jamais vers un autre domaine).
- **Enregistré dans** : `app.config.ts`, en premier dans `withInterceptors([jwtInterceptor, errorsInterceptor])`. S'applique à toutes les requêtes de `HttpClient`.
- **Écart d'architecture** : dans `shared/`, mais importe `AuthService` de la feature auth (voir 1.1).

#### errorsInterceptor (`shared/errors-interceptor.ts`)
- **Type** : interceptor fonctionnel écrit comme l'exemple de la doc (`function` typée `HttpRequest` / `HttpHandlerFn`, `next(req).pipe(tap(…))`). Les erreurs sont lues dans le callback `error` de `tap`, qui ne les arrête pas : elles arrivent toujours jusqu'à la page.
- **Rôle** :
  - **401** hors `/auth/` (token absent ou expiré) : `AuthService.deconnexion()` puis navigation vers `/connexion`. Sur `/auth/login`, un 401 = mauvais mot de passe : rien.
  - **500** : erreur confiée au gestionnaire d'erreurs global d'Angular (`ErrorHandler.handleError`), point unique où brancher plus tard un outil de suivi d'erreurs.
  - Autres erreurs : rien de spécial.
- **Injection** : `AuthService`, `Router` et `ErrorHandler`, injectés au début de la fonction.
- **Enregistré dans** : `app.config.ts`, après `jwtInterceptor` (`withInterceptors([jwtInterceptor, errorsInterceptor])`).
- **Écart d'architecture** : dans `shared/`, mais importe `AuthService` de la feature auth (voir 1.1).

## 5. Layout

_Pas encore de dossier `layout/` (voir l'écart en 1.1)._

## 6. État d'avancement

**Étape de la progression des données** : 1 – HTTP avec observables froids (en cours). La session de la feature auth a servi d'exemple à l'étape 2 (`BehaviorSubject`), puis a été basculée en `signal()` (premier pas de l'étape 3). Les requêtes HTTP de la feature auth restent en observables + pipe `async`.

### Fait

- Projet généré avec Angular CLI 22 (standalone, zoneless).
- Bootstrap 5.3 ajouté aux dépendances npm.
- Bootstrap chargé via `@import` dans `src/styles.css`.
- Routes de toutes les features en lazy loading, avec un `title` par page.
- Squelettes générés : pages, `FormAuth`, `FormContact`, `AuthService`, composants de `shared/`.
- `Nav` : navigation principale avec `routerLink` / `routerLinkActive` et ses tests.
- `LayoutSlice` : mise en page en deux colonnes avec `ng-content` (`slotStart` / `slotEnd`) et ses tests.
- `LayoutTopBottom` : mise en page en deux blocs empilés (haut / bas, 50 % de la hauteur chacun), mêmes slots, et ses tests.
- `LayoutPages` (exercice, pour le moment) : cadre des pages de liste (en-tête, barre d'outils, contenu, pied de page) et ses tests.
- `Header` : bandeau conforme à la maquette (`Logo`, menu `Nav`, utilisateur, déconnexion), en HTML statique, et ses tests.
- `Logo` : composant dumb extrait du header, et ses tests.
- `ButtonSmall` : bouton réutilisable (signal inputs, `output()`), utilisé pour « Déconnexion » dans le header. Avec ses tests.
- `BadgeUtilisateur` et le pipe `initiales` : bloc utilisateur extrait du header, avec leurs tests.
- `Header` branché sur la session : utilisateur et bouton « Déconnexion » affichés seulement s'il y a une session (`authService.session()`), déconnexion réelle. Avec ses tests.
- Routes : `/connexion` hors coque, pages de l'application dans la coque `AppShell` (header + `<router-outlet>` enfant).
- `PageAuth` : colonne de présentation conforme à la maquette (`LayoutSlice` + `Logo`), avec ses tests.
- Environnements : `environment.ts` / `environment.prod.ts` avec `apiBaseUrl`, remplacement automatique au build de production (`fileReplacements`).
- API documentée depuis le Swagger dans `.claude/endpoints-et-donnees.md` (endpoints, modèles, erreurs).
- `provideHttpClient()` dans `app.config.ts`.
- `jwtInterceptor` : token JWT ajouté aux requêtes vers l'API (`Authorization: Bearer`), enregistré avec `withInterceptors`. Avec ses tests.
- `EntreprisesService` (CRUD, observables froids) et `PageEntreprises` (liste dans `LayoutPages` avec `httpResource()` : chargement, erreur, liste vide, lien « Ajouter une entreprise », colonne Actions : lien Modifier, suppression avec confirmation et rechargement). Avec leurs tests.
- `errorsInterceptor` : sur le modèle de la doc (`tap`), 401 hors `/auth/` → déconnexion et `/connexion`, 500 → `ErrorHandler`. Avec ses tests.
- Feature auth complète, requêtes en observables : `AuthService` (connexion, inscription, déconnexion, session en `signal()` + `localStorage`, d'abord écrite avec un `BehaviorSubject`), `FormAuth` (formulaire réactif, connexion et inscription), `PageAuth` (pipe `async`, navigation, messages d'erreur). Avec leurs tests.

### À faire

- Retirer de `App` les imports inutilisés (`LayoutSlice`, `LayoutTopBottom`, `LayoutPages` : avertissements `NG8113` au build).
- Corriger `app-shell.spec.ts` : `AppShell` ne se crée pas sans `provideRouter()` (erreur « No provider found for `ActivatedRoute` »).
- Supprimer l'écart d'architecture de `Header` (`shared/` qui importe `AuthService` de la feature auth) : session dans un service de `shared/`, ou données passées par `AppShell`.
- Protéger les pages de l'application par un guard (redirection vers `/connexion` sans session).
- Corriger `app.spec.ts` : il cherche encore le `<h1>` du template par défaut, et `App` ne se crée plus sans `provideRouter()` (le header contient des `routerLink`).
- Aligner les dossiers sur l'architecture cible (voir l'écart en 1.1).
- Installer et configurer Playwright (dossier `e2e/`, scripts `npm run e2e*`).
- Entreprises : routes et pages `/entreprises/ajouter` et `/entreprises/{id}/modifier` (cibles des liens « Ajouter une entreprise » et « Modifier »).
- Features : `auth`, `entreprises`, `contacts`, `opportunites`.
