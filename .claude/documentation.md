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

### 1.2 Démarrage de l'application

- `src/main.ts` : `bootstrapApplication(App, appConfig)`, sans NgModule.
- `src/app/app.config.ts` : providers globaux (`provideRouter`, `provideBrowserGlobalErrorListeners`). Aucun service de feature n'y est fourni.
- `src/app/app.ts` : composant racine `App`, affiche `<router-outlet>`.
- Styles : Bootstrap (CSS) + `src/styles.css`.

## 2. Routes

Déclarées dans `src/app/app.routes.ts`, pages chargées en lazy loading.

| Chemin | Composant | Feature | Guard | Description |
| ------ | --------- | ------- | ----- | ----------- |
| —      | —         | —       | —     | Aucune route pour l'instant |

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

### 3.1 auth

_Rien pour l'instant._

### 3.2 entreprises

_Rien pour l'instant._

### 3.3 contacts

_Rien pour l'instant._

### 3.4 opportunites

_Rien pour l'instant._

## 4. Shared

_Rien pour l'instant._

## 5. Layout

_Rien pour l'instant._

## 6. État d'avancement

**Étape de la progression des données** : 1 – HTTP avec observables froids (pas encore commencée).

### Fait

- Projet généré avec Angular CLI 22 (standalone, zoneless).
- Bootstrap 5.3 ajouté aux dépendances npm.

### À faire

- Importer le CSS de Bootstrap dans `angular.json` (tableau `styles`).
- Remplacer le template par défaut de `app.html`.
- Installer et configurer Playwright (dossier `e2e/`, scripts `npm run e2e*`).
- Créer `.claude/endpoints-et-donnees.md`.
- Features : `auth`, `entreprises`, `contacts`, `opportunites`.
