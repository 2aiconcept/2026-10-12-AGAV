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

**Écart actuel avec cette cible** : les dossiers du code s'appellent `Feature-<feature>/` (au lieu de `<feature>/`), `pages/` (au lieu de `smart-components/`) et `ui/` (au lieu de `dump-components/`). `Feature-not-found/` existe en plus des quatre features. Il n'y a pas encore de dossier `layout/` : `app-shell`, `header`, `nav`, `logo`, `button-small`, `badge-utilisateur`, `pipes`, `layout-pages`, `layout-slice` et `layout-top-bottom` sont dans `shared/`.

### 1.2 Démarrage de l'application

- `src/main.ts` : `bootstrapApplication(App, appConfig)`, sans NgModule.
- `src/app/app.config.ts` : providers globaux (`provideRouter`, `provideBrowserGlobalErrorListeners`). Aucun service de feature n'y est fourni.
- `src/app/app.ts` : composant racine `App`. `app.html` n'affiche que `<router-outlet>` (le header et une démonstration de `<app-layout-pages>` y sont en commentaire). Le header est affiché par `AppShell`, sur les pages connectées seulement (voir section 2).
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

#### PageAuth (`Feature-auth/pages/page-auth/page-auth.ts`)
- **Type** : smart
- **Rôle** : page de connexion, en deux colonnes avec `LayoutSlice`. Colonne gauche (`slotStart`) : `<app-logo>` en haut, au centre (`my-auto`) l'accroche « Mini-CRM », le titre `h1` et l'invitation à se connecter, en bas le copyright. Colonne droite (`slotEnd`) : texte provisoire « formulaire » (le formulaire est à venir). Uniquement des classes Bootstrap ; les gris et l'accent viennent du thème sombre de la colonne (`text-body-secondary`, `text-primary-emphasis`).
- **Utilisé par** : route `connexion`.

#### FormAuth (`Feature-auth/ui/form-auth/form-auth.ts`)
- **Type** : dumb
- **Rôle** : formulaire de connexion (à venir).
- **Utilisé par** : personne pour l'instant.

#### AuthService (`Feature-auth/data-access/auth-service.ts`)
- **Type** : service (`@Service()`)
- **Rôle** : connexion à l'API (à venir). Classe vide pour l'instant.
- **Utilisé par** : personne pour l'instant.

### 3.2 entreprises

#### PageEntreprises (`Feature-entreprises/pages/page-entreprises/page-entreprises.ts`)
- **Type** : smart
- **Rôle** : liste des entreprises.
- **Utilisé par** : route `entreprises`.

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
- **Type** : dumb pour l'instant (n'injecte rien : importe la directive `RouterLink` et les composants `Logo`, `Nav`, `BadgeUtilisateur` et `ButtonSmall`)
- **Rôle** : bandeau en haut de l'application (`<header>`, `bg-dark`). De gauche à droite : `<app-logo>` dans un lien vers `/entreprises`, le menu `<app-nav>` (qui prend la place libre avec `flex-grow-1`), `<app-badge-utilisateur>` et le bouton « Déconnexion » (`<app-button-small>`, contour `light`).
- **Données** : l'utilisateur affiché est une constante en dur (`Chris Martin`) en attendant la feature auth.
- **Déconnexion** : le clic appelle la méthode `logout()` du header, encore vide (l'appel au service d'authentification est en commentaire). L'output `deconnexion` a été mis en commentaire.
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
- **Rôle** : `prenom`, `nom`. Provisoire : à aligner sur la réponse de l'API d'authentification quand `endpoints-et-donnees.md` existera.
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

> **Exercice, pour le moment** : ce composant est un corrigé d'exercice. Il n'est utilisé par aucune page et peut encore changer.

- **Type** : dumb (mise en page par projection de contenu)
- **Rôle** : cadre commun des pages de liste (entreprises, contacts, opportunités). C'est une carte Bootstrap (`card shadow-sm`) dans un `container`, découpée en quatre zones séparées par une bordure : en-tête, barre d'outils, contenu (`card-body p-3`) et pied de page. Ne pose aucun repère (`<main>`…).
- **Entrées** : quatre `ng-content`, dans cet ordre d'affichage : `[pageHeader]` (titre et action principale), `[pageToolbar]` (recherche, filtres), contenu par défaut (tout ce qui n'a pas d'attribut de slot, ex. : le tableau), `[pageFooter]` (compteur, pagination). Une zone sans contenu reste affichée, vide.
- **Sorties** : aucune.
- **Utilisé par** : personne pour l'instant (importé dans `App`, démonstration en commentaire dans `app.html`).

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

## 5. Layout

_Pas encore de dossier `layout/` (voir l'écart en 1.1)._

## 6. État d'avancement

**Étape de la progression des données** : 1 – HTTP avec observables froids (pas encore commencée).

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
- Routes : `/connexion` hors coque, pages de l'application dans la coque `AppShell` (header + `<router-outlet>` enfant).
- `PageAuth` : colonne de présentation conforme à la maquette (`LayoutSlice` + `Logo`), avec ses tests. Le formulaire reste à faire.

### À faire

- Retirer de `App` les imports inutilisés (`LayoutSlice`, `LayoutTopBottom`, `LayoutPages` : avertissements `NG8113` au build).
- Corriger `app-shell.spec.ts` : `AppShell` ne se crée pas sans `provideRouter()` (erreur « No provider found for `ActivatedRoute` »).
- Remplacer le texte provisoire « formulaire » de `PageAuth` par `FormAuth`.
- Brancher `Header` sur l'utilisateur connecté et faire déconnecter réellement `logout()` (feature auth).
- Corriger `app.spec.ts` : il cherche encore le `<h1>` du template par défaut, et `App` ne se crée plus sans `provideRouter()` (le header contient des `routerLink`).
- Aligner les dossiers sur l'architecture cible (voir l'écart en 1.1).
- Installer et configurer Playwright (dossier `e2e/`, scripts `npm run e2e*`).
- Créer `.claude/endpoints-et-donnees.md`.
- Features : `auth`, `entreprises`, `contacts`, `opportunites`.
