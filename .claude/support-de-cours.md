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
