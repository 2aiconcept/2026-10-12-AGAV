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

**Écart actuel avec cette cible** : les dossiers du code s'appellent `Feature-<feature>/` (au lieu de `<feature>/`), `pages/` (au lieu de `smart-components/`) et `ui/` (au lieu de `dump-components/`). `Feature-not-found/` existe en plus des quatre features. Il n'y a pas encore de dossier `layout/` : `header`, `nav`, `layout-pages` et `layout-slice` sont dans `shared/`.

### 1.2 Démarrage de l'application

- `src/main.ts` : `bootstrapApplication(App, appConfig)`, sans NgModule.
- `src/app/app.config.ts` : providers globaux (`provideRouter`, `provideBrowserGlobalErrorListeners`). Aucun service de feature n'y est fourni.
- `src/app/app.ts` : composant racine `App`, affiche `<router-outlet>`.
- Styles : `src/styles.css` (vide). Bootstrap est installé mais pas encore importé dans `angular.json`.

## 2. Routes

Déclarées dans `src/app/app.routes.ts`. Toutes les pages sont chargées en lazy loading (`loadComponent`, ou `loadChildren` pour une feature à plusieurs pages) et exportées par défaut (`export default class`). Chaque route a un `title` (titre de l'onglet, annoncé par les lecteurs d'écran).

| Chemin                | Composant            | Feature        | Guard | Description                          |
| --------------------- | -------------------- | -------------- | ----- | ------------------------------------ |
| `''`                  | `PageAuth`           | auth           | —     | Connexion                            |
| `entreprises`         | `PageEntreprises`    | entreprises    | —     | Liste des entreprises                |
| `contacts`            | `PageContacts`       | contacts       | —     | Liste des contacts (`contacts.routes.ts`) |
| `contacts/ajouter`    | `PageAjouterContact` | contacts       | —     | Création d'un contact                |
| `contacts/editer/:id` | `PageEditerContact`  | contacts       | —     | Modification d'un contact            |
| `opportunites`        | `PageOpportunites`   | opportunites   | —     | Liste des opportunités               |
| `**`                  | `PageNotFound`       | not-found      | —     | Page introuvable                     |

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

Sauf mention contraire (voir `Nav`), les composants ci-dessous sont des squelettes générés par le CLI : template `<p>… works!</p>`, sans input, output ni logique. Les fiches seront complétées quand ils auront un comportement.

### 3.1 auth

#### PageAuth (`Feature-auth/pages/page-auth/page-auth.ts`)
- **Type** : smart
- **Rôle** : page de connexion.
- **Utilisé par** : route `''`.

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
- **Type** : dumb
- **Rôle** : en-tête de l'application (à venir).
- **Utilisé par** : personne pour l'instant.

#### Nav (`shared/nav/nav.ts`)
- **Type** : dumb (n'injecte rien : utilise seulement les directives `RouterLink` et `RouterLinkActive` dans le template)
- **Rôle** : navigation principale (`<nav aria-label="Navigation principale">`), avec des liens vers `/entreprises`, `/contacts` et `/opportunites` (pills Bootstrap). Le lien de la page courante reçoit la classe `active` et `aria-current="page"`.
- **Entrées / sorties** : aucune.
- **Utilisé par** : personne pour l'instant (à placer dans le header ou la mise en page commune).

#### LayoutPages (`shared/layout-pages/layout-pages.ts`)
- **Type** : dumb
- **Rôle** : mise en page commune des pages (à venir).
- **Utilisé par** : personne pour l'instant.

#### LayoutSlice (`shared/layout-slice/layout-slice.ts`)
- **Type** : dumb
- **Rôle** : à préciser.
- **Utilisé par** : personne pour l'instant.

## 5. Layout

_Pas encore de dossier `layout/` (voir l'écart en 1.1)._

## 6. État d'avancement

**Étape de la progression des données** : 1 – HTTP avec observables froids (pas encore commencée).

### Fait

- Projet généré avec Angular CLI 22 (standalone, zoneless).
- Bootstrap 5.3 ajouté aux dépendances npm.
- `app.html` réduit à `<router-outlet>`.
- Routes de toutes les features en lazy loading, avec un `title` par page.
- Squelettes générés : pages, `FormAuth`, `FormContact`, `AuthService`, composants de `shared/`.
- `Nav` : navigation principale avec `routerLink` / `routerLinkActive` et ses tests.

### À faire

- Importer le CSS de Bootstrap dans `angular.json` (tableau `styles`).
- Afficher `Nav` (dans le header ou la mise en page commune).
- Corriger `app.spec.ts`, qui cherche encore le `<h1>` du template par défaut.
- Aligner les dossiers sur l'architecture cible (voir l'écart en 1.1).
- Installer et configurer Playwright (dossier `e2e/`, scripts `npm run e2e*`).
- Créer `.claude/endpoints-et-donnees.md`.
- Features : `auth`, `entreprises`, `contacts`, `opportunites`.
