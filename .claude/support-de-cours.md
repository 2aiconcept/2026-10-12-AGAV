# Support de cours : Angular 22, de l'initiation à l'avancé

Notions abordées pendant la construction du mini-CRM, dans l'ordre où on les rencontre. Chaque notion suit le même plan : explication, exemple tiré de notre application, liens vers la documentation officielle.

<!--
Modèle de notion, à recopier :

### N.M Titre de la notion

**En bref** : une ou deux phrases.

**Explication** : ce que c'est, pourquoi on l'utilise, la bonne pratique, le piège à éviter.

**Dans notre appli** (`chemin/du/fichier.ts`) :

```ts
// extrait réel du code du mini-CRM
```

**Docs officielles** :
- [Titre](https://angular.dev/...)
-->

## Sommaire

1. [Démarrer une application Angular 22](#1-démarrer-une-application-angular-22)
2. [Le routing](#2-le-routing)

## 1. Démarrer une application Angular 22

### 1.1 Créer le projet avec Angular CLI

**En bref** : `ng new` génère un projet prêt à lancer, avec build, serveur de dev et tests.

**Explication** : le CLI crée la structure (`src/`, `angular.json`, `tsconfig*.json`) et installe les dépendances. Depuis Angular 20, les fichiers générés n'ont plus de suffixe (`app.ts` au lieu de `app.component.ts`). En Angular 22, le projet est standalone et zoneless par défaut, et les tests unitaires utilisent Vitest.

**Dans notre appli** (`package.json`) :

```json
"scripts": {
  "start": "ng serve",
  "build": "ng build",
  "test": "ng test"
}
```

**Docs officielles** :
- [Installation et création d'un projet](https://angular.dev/installation)
- [Angular CLI](https://angular.dev/tools/cli)

### 1.2 Démarrer sans NgModule : `bootstrapApplication`

**En bref** : l'application démarre directement sur un composant standalone, avec une configuration de providers.

**Explication** : `main.ts` appelle `bootstrapApplication(App, appConfig)`. Les providers globaux (router, HTTP…) se déclarent dans `app.config.ts`. Bonne pratique : n'y mettre que ce qui est vraiment global ; les services de feature utilisent `@Service()` et ne sont chargés que lorsqu'on s'en sert.

**Dans notre appli** (`src/app/app.config.ts`) :

```ts
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes)],
};
```

**Docs officielles** :
- [bootstrapApplication](https://angular.dev/api/platform-browser/bootstrapApplication)
- [Composants standalone](https://angular.dev/guide/components)

### 1.3 Styler avec Bootstrap en CSS

**En bref** : on utilise les classes utilitaires de Bootstrap dans les templates pour écrire le moins de CSS possible.

**Explication** : Bootstrap est installé avec npm et son CSS précompilé est ajouté une seule fois dans le tableau `styles` de `angular.json`. On ne le réimporte jamais dans un composant, sinon tout son CSS serait dupliqué.

**Dans notre appli** (`package.json`) :

```json
"bootstrap": "^5.3.8"
```

**Docs officielles** :
- [Bootstrap 5.3 : démarrage](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
- [Styles globaux dans angular.json](https://angular.dev/reference/configs/workspace-config)

### 1.4 Brancher l'IA sur Angular et Playwright : les serveurs MCP

**En bref** : un serveur MCP donne à un assistant IA des outils en plus. `ng mcp` lui donne accès à la doc et aux bonnes pratiques Angular, `@playwright/mcp` lui permet de piloter un navigateur.

**Explication** : chaque éditeur ou assistant lit sa propre configuration MCP. VS Code (Copilot) lit `.vscode/mcp.json` (clé `servers`), Claude Code lit `.mcp.json` à la racine du projet (clé `mcpServers`). Le piège : déclarer les serveurs dans un seul de ces fichiers et croire que tous les outils les voient. Les deux fichiers sont versionnés pour que toute l'équipe ait les mêmes serveurs. Sous Windows, si `npx` ne démarre pas, on passe par `"command": "cmd"` avec `"/c", "npx"` en tête des arguments.

**Dans notre appli** (`.mcp.json`) :

```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Docs officielles** :
- [Serveur MCP d'Angular CLI](https://angular.dev/ai/mcp)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [MCP dans Claude Code](https://docs.anthropic.com/en/docs/claude-code/mcp)

## 2. Le routing

### 2.1 Charger les pages en lazy loading : `loadComponent` et `loadChildren`

**En bref** : chaque page est téléchargée seulement quand on navigue vers elle, au lieu d'alourdir le bundle initial.

**Explication** : `component: MaPage` importe la page en haut du fichier de routes, donc elle part dans le bundle initial. `loadComponent: () => import('...')` crée un chunk séparé, chargé à la première visite. Pour une feature à plusieurs pages, `loadChildren` charge un fichier de routes propre à la feature, qui charge lui-même ses pages en lazy loading. Avec `export default`, le router récupère directement l'export par défaut, sans `.then((m) => m.MaPage)`. Le piège : garder un `import` en haut de `app.routes.ts` (même inutilisé ou pour une seule route) remet la page dans le bundle initial. On le vérifie avec `npm run build`, qui liste les « Lazy chunk files ».

**Dans notre appli** (`src/app/app.routes.ts`) :

```ts
{
  path: 'contacts',
  loadChildren: () => import('./Feature-contacts/contacts.routes'),
},
{
  path: 'opportunites',
  title: 'Opportunités – Mini-CRM',
  loadComponent: () => import('./Feature-opportunites/pages/page-opportunites/page-opportunites'),
},
```

(`src/app/Feature-contacts/contacts.routes.ts`) :

```ts
const contactsRoutes: Routes = [
  {
    path: '',
    title: 'Contacts – Mini-CRM',
    loadComponent: () => import('./pages/page-contacts/page-contacts'),
  },
  // ...
];

export default contactsRoutes;
```

**Docs officielles** :
- [Lazy loading des routes](https://angular.dev/guide/routing/define-routes#lazily-loaded-components-and-routes)
- [Route (API)](https://angular.dev/api/router/Route)

### 2.2 Donner un titre à chaque page : `title`

**En bref** : la propriété `title` d'une route met à jour le titre de l'onglet à chaque navigation.

**Explication** : dans une application monopage (SPA), le `<title>` ne change pas tout seul. Or c'est la première information qu'un lecteur d'écran annonce après une navigation, et ce qui s'affiche dans l'onglet et l'historique. Bonne pratique : un titre unique par page, du plus précis au plus général (« Contacts – Mini-CRM »). Critère WCAG 2.4.2 « Titre de page ».

**Dans notre appli** (`src/app/app.routes.ts`) :

```ts
{
  path: '**',
  title: 'Page introuvable – Mini-CRM',
  loadComponent: () => import('./Feature-not-found/pages/page-not-found/page-not-found'),
},
```

**Docs officielles** :
- [Titre de page](https://angular.dev/guide/routing/define-routes#page-titles)
- [WCAG 2.4.2 Page Titled](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html)
