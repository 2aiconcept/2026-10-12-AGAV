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
3. [Les composants](#3-les-composants)
4. [HTTP et services](#4-http-et-services)
5. [Formulaires](#5-formulaires)
6. [Tests unitaires](#6-tests-unitaires)
7. [Tests e2e avec Playwright](#7-tests-e2e-avec-playwright)
8. [NgRx Signal Store](#8-ngrx-signal-store)

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

**Explication** : Bootstrap est installé avec npm, puis son CSS précompilé est chargé **une seule fois**, dans la feuille de styles globale. Deux façons équivalentes existent : l'ajouter au tableau `styles` de `angular.json`, ou faire un `@import` en haut de `src/styles.css`. Nous avons choisi l'`@import`. Le chemin `bootstrap/dist/...` est résolu dans `node_modules` par le builder. Le piège : réimporter Bootstrap dans le `.css` d'un composant. Tout son CSS (plus de 200 kB) serait alors copié dans ce composant. On vérifie le résultat avec `npm run build` : le bundle `styles` passe de 0 à environ 230 kB.

**Dans notre appli** (`package.json`) :

```json
"bootstrap": "^5.3.8"
```

(`src/styles.css`) :

```css
@import 'bootstrap/dist/css/bootstrap.min.css';
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

### 1.5 Configurer par environnement : `environment.ts` et `fileReplacements`

**En bref** : on met ce qui change entre développement et production (URL de l'API, indicateurs) dans un fichier d'environnement. Au build de production, Angular le remplace par sa version `.prod`.

**Explication** :
- Les deux fichiers exportent le même objet `environment`, avec les mêmes propriétés et des valeurs différentes.
- Le code importe **toujours** `environments/environment`, jamais `environment.prod` : c'est `fileReplacements`, dans la configuration `production` d'`angular.json`, qui fait l'échange au moment du build.
- `ng serve` utilise la configuration `development` par défaut, donc `environment.ts`. `ng build` utilise `production` par défaut, donc `environment.prod.ts`.
- Bonne pratique : `production: false` dans `environment.ts`, `true` dans la version `.prod`. Sinon l'indicateur ne sert à rien.
- Le piège : ces fichiers sont inclus dans le JavaScript envoyé au navigateur. On n'y met jamais de secret (mot de passe, clé privée), seulement de la configuration publique comme une URL d'API.
- `ng generate environments` crée les fichiers et la configuration automatiquement.

**Dans notre appli** (`angular.json`, configuration `production` du build) :

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

(`src/environments/environment.prod.ts`) :

```ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://mini-crm-api-jwt-production.up.railway.app/api',
};
```

**Docs officielles** :
- [Configurer les environnements de l'application](https://angular.dev/tools/cli/environments)

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

### 2.3 Naviguer avec `routerLink` et `routerLinkActive`

**En bref** : `routerLink` navigue sans recharger la page, `routerLinkActive` met en évidence le lien de la page courante.

**Explication** : un `<a href>` classique recharge toute l'application. `routerLink` garde un vrai `<a>` avec un `href` (clic droit, nouvel onglet et clavier fonctionnent), mais la navigation passe par le router. Les deux directives s'importent dans le composant (`imports: [RouterLink, RouterLinkActive]`) : le composant reste dumb, car il n'injecte pas le `Router`. `routerLinkActive` ajoute une ou plusieurs classes au lien courant, séparées par des espaces. Ici, ce sont des utilitaires Bootstrap pour un fond sombre : fond blanc translucide (`bg-white bg-opacity-10`), texte opaque (`link-opacity-100`) et semi-gras. Les liens inactifs sont en `link-light link-opacity-75`. Le piège : ce surlignage ne se voit pas avec un lecteur d'écran et passe par la couleur seule. On ajoute donc `ariaCurrentWhenActive="page"`, qui pose `aria-current="page"` sur le lien actif. Bonne pratique : entourer les liens d'un `<nav>` nommé avec `aria-label`, et utiliser `<a routerLink>` pour naviguer, jamais un `<button>` avec `router.navigate()`.

**Dans notre appli** (`src/app/shared/nav/nav.html`) :

```html
<nav aria-label="Navigation principale">
  <ul class="nav gap-2">
    <li class="nav-item">
      <a
        class="nav-link rounded-3 link-light link-opacity-75 link-opacity-100-hover"
        routerLink="/entreprises"
        routerLinkActive="bg-white bg-opacity-10 link-opacity-100 fw-semibold"
        ariaCurrentWhenActive="page"
        >Entreprises</a
      >
    </li>
    <!-- Contacts, Opportunités -->
  </ul>
</nav>
```

Pour le tester, on fournit de vraies routes avec `provideRouter()`, on navigue, puis on vérifie l'attribut `aria-current` (`src/app/shared/nav/nav.spec.ts`) :

```ts
it('signale le lien de la page courante avec aria-current', async () => {
  await TestBed.inject(Router).navigateByUrl('/contacts');
  await fixture.whenStable();

  expect(lien('Contacts')?.getAttribute('aria-current')).toBe('page');
  expect(lien('Entreprises')?.hasAttribute('aria-current')).toBe(false);
});
```

**Docs officielles** :
- [Naviguer vers une route : `routerLink`](https://angular.dev/guide/routing/navigate-to-routes)
- [RouterLinkActive (API)](https://angular.dev/api/router/RouterLinkActive)
- [Bootstrap : Navs](https://getbootstrap.com/docs/5.3/components/navs-tabs/)
- [MDN : aria-current](https://developer.mozilla.org/fr/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current)

### 2.4 Une coque pour certaines pages : routes enfants et `<router-outlet>` imbriqué

**En bref** : une route parente affiche un composant « coque » (header…), et ses routes enfants s'affichent dans le `<router-outlet>` de cette coque.

**Explication** : la page de connexion ne doit pas afficher le header, mais les pages de l'application si. Plutôt que de cacher le header avec un `@if` selon l'URL, on range les routes : `/connexion` et la page introuvable au premier niveau, et les pages de l'application en `children` d'une route qui affiche `AppShell`. `App` n'a plus qu'un `<router-outlet>`, et `AppShell` contient le header puis son propre `<router-outlet>`, dans un `<main>`. `{ path: '', redirectTo: 'entreprises', pathMatch: 'full' }` envoie `/` vers la liste des entreprises. `pathMatch: 'full'` est obligatoire pour une redirection depuis un chemin vide, sinon elle s'appliquerait à toutes les URL. Le piège pour les tests : un composant qui contient un `<router-outlet>` ou des `routerLink` a besoin de `provideRouter([])` dans son spec.

**Dans notre appli** (`src/app/app.routes.ts`) :

```ts
{
  path: '',
  component: AppShell,
  children: [
    {
      path: 'entreprises',
      title: 'Entreprises – Mini-CRM',
      loadComponent: () =>
        import('./Feature-entreprises/pages/page-entreprises/page-entreprises'),
    },
    // contacts, opportunites…
    { path: '', redirectTo: 'entreprises', pathMatch: 'full' },
  ],
},
```

(`src/app/shared/app-shell/app-shell.html`) :

```html
<app-header />
<main>
  <router-outlet></router-outlet>
</main>
```

**Docs officielles** :
- [Routes enfants (nested routes)](https://angular.dev/guide/routing/define-routes#nested-routes)
- [Redirections](https://angular.dev/guide/routing/redirecting-routes)

## 3. Les composants

### 3.1 Projeter du contenu avec `ng-content` et `select`

**En bref** : `<ng-content>` affiche, à l'intérieur d'un composant, le HTML que la page a écrit entre ses balises. Avec `select`, on crée plusieurs emplacements (slots).

**Explication** : un composant de mise en page ne connaît pas son contenu : il fournit le cadre, la page fournit ce qu'on met dedans. Plutôt que de passer du texte par des `input()`, on projette directement du HTML. `select="[slotStart]"` ne prend que les éléments qui portent l'attribut `slotStart`. On peut sélectionner aussi par balise ou par classe, mais un attribut dédié est le plus explicite. Le piège : un élément qui ne correspond à aucun `select` (et sans `<ng-content>` par défaut) n'est pas affiché du tout. Autre point : le contenu projeté appartient à la page, pas au composant. Ses liaisons et son style viennent donc de la page.

**Dans notre appli** (`src/app/shared/layout-slice/layout-slice.html`) :

```html
<div class="container-fluid">
  <div class="row min-vh-100">
    <div class="col-md-6 d-flex flex-column bg-dark text-white p-4 p-lg-5" data-bs-theme="dark">
      <ng-content select="[slotStart]" />
    </div>
    <div
      class="col-md-6 d-flex align-items-center justify-content-center bg-body-tertiary p-4 p-lg-5"
    >
      <ng-content select="[slotEnd]" />
    </div>
  </div>
</div>
```

Utilisation dans la page de connexion. Plusieurs éléments peuvent viser le même slot (ils s'affichent dans l'ordre où la page les écrit), et un composant peut lui-même porter l'attribut (`<app-logo slotStart />`). Ici, les trois blocs de la colonne gauche ont finalement été regroupés dans une seule `<section slotStart aria-label="…">`. L'audit d'accessibilité (7.1) demandait que tout le contenu soit dans un repère. Mise en page de la colonne en 3.6 (`src/app/Feature-auth/pages/page-auth/page-auth.html`) :

```html
<app-layout-slice>
  <section slotStart class="d-flex flex-column flex-grow-1" aria-label="Présentation du Mini-CRM">
    <app-logo />
    <div class="my-auto py-5">…accroche, titre, sous-titre…</div>
    <p class="mb-0 small text-body-secondary">© 2026 Liane</p>
  </section>

  <main slotEnd class="w-100 d-flex justify-content-center">…formulaire…</main>
</app-layout-slice>
```

Pour tester un composant qui projette du contenu, on crée un petit composant hôte dans le spec (`src/app/shared/layout-slice/layout-slice.spec.ts`) :

```ts
@Component({
  imports: [LayoutSlice],
  template: `
    <app-layout-slice>
      <p slotStart>Contenu de gauche</p>
      <p slotEnd>Contenu de droite</p>
      <p>Contenu sans slot</p>
    </app-layout-slice>
  `,
})
class PageHote {}
```

Le même principe sert pour une mise en page en haut / bas. On garde les **mêmes attributs de slot**, et une page peut passer d'une mise en page à l'autre en changeant seulement la balise. Piège Bootstrap : `h-50` vaut 50 % de la hauteur **du parent**. Il faut donc que le parent ait une hauteur fixe (`vh-100`), sinon `h-50` n'a aucun effet. Avec `overflow-auto`, un bloc défile s'il a trop de contenu (`src/app/shared/layout-top-bottom/layout-top-bottom.html`) :

```html
<div class="d-flex flex-column vh-100">
  <div class="h-50 overflow-auto d-flex flex-column bg-dark text-white p-4 p-lg-5">
    <ng-content select="[slotStart]" />
  </div>
  <div
    class="h-50 overflow-auto d-flex align-items-center justify-content-center bg-body-tertiary p-4 p-lg-5"
  >
    <ng-content select="[slotEnd]" />
  </div>
</div>
```

**Docs officielles** :
- [Projection de contenu avec ng-content](https://angular.dev/guide/components/content-projection)
- [Bootstrap : grille](https://getbootstrap.com/docs/5.3/layout/grid/)
- [Bootstrap : tailles (`h-50`, `vh-100`)](https://getbootstrap.com/docs/5.3/utilities/sizing/)

### 3.2 Combiner des slots nommés et un `ng-content` par défaut

> **Issu d'un exercice** : `LayoutPages` est un corrigé d'exercice, désormais utilisé par la page des entreprises (voir 4.8). L'exemple d'utilisation ci-dessous est une illustration ; la version réelle est en 4.8.

**En bref** : un `<ng-content />` sans `select` reçoit tout ce qui n'est pris par aucun slot nommé. Il sert pour le contenu principal.

**Explication** : dans une page de liste, l'en-tête, la barre d'outils et le pied de page sont des zones secondaires : on les marque avec un attribut (`pageHeader`, `pageToolbar`, `pageFooter`). Le contenu principal (le tableau) n'a pas besoin d'attribut, il tombe dans le `ng-content` par défaut. L'ordre d'affichage est celui du **template du layout**, pas celui de la page : la page peut écrire ses blocs dans n'importe quel ordre. Le piège : il ne doit y avoir qu'un seul `ng-content` sans `select`. Autre piège : une zone sans contenu reste affichée avec ses bordures. Côté Bootstrap, la carte (`card`, `card-header`, `card-body`, `card-footer`) donne le cadre, les séparateurs et les coins arrondis sans CSS. Les marges intérieures se règlent zone par zone avec `p-*` (`p-3` sur le corps ; `p-0` laisserait un tableau toucher les bords de la carte).

**Dans notre appli** (`src/app/shared/layout-pages/layout-pages.html`) :

```html
<div class="container py-4">
  <div class="card shadow-sm">
    <div class="card-header bg-body p-4">
      <ng-content select="[pageHeader]" />
    </div>
    <div class="border-bottom p-3">
      <ng-content select="[pageToolbar]" />
    </div>
    <div class="card-body p-3">
      <ng-content />
    </div>
    <div class="card-footer bg-body px-4 py-3">
      <ng-content select="[pageFooter]" />
    </div>
  </div>
</div>
```

Utilisation dans une page :

```html
<app-layout-pages>
  <div pageHeader class="d-flex justify-content-between align-items-center">
    <div>
      <p class="text-secondary mb-1">Portefeuille commercial</p>
      <h1 class="h2 mb-0">Entreprises</h1>
    </div>
    <button type="button" class="btn btn-primary">Nouvelle entreprise</button>
  </div>
  <div pageToolbar>…recherche…</div>
  <table class="table mb-0">…</table>
  <div pageFooter>4 entreprises affichées</div>
</app-layout-pages>
```

Le test vérifie que l'ordre d'affichage suit le layout, même si l'hôte écrit les blocs dans le désordre (`src/app/shared/layout-pages/layout-pages.spec.ts`).

**Docs officielles** :
- [Projection de contenu avec ng-content](https://angular.dev/guide/components/content-projection)
- [Bootstrap : Card](https://getbootstrap.com/docs/5.3/components/card/)

### 3.3 Reproduire une maquette avec Bootstrap, CSS custom au minimum

**En bref** : on construit un écran avec les classes utilitaires de Bootstrap (flex, espacements, couleurs). On n'écrit du CSS que pour ce que Bootstrap ne sait pas faire.

**Explication** : pour une barre horizontale, `d-flex align-items-center gap-4` aligne les blocs et les espace sans CSS. `flex-grow-1` sur la zone centrale pousse le reste à droite. Bouton en pilule : `btn btn-outline-light rounded-pill`. Avant d'écrire une règle CSS, on vérifie qu'aucune classe ne le fait. Ici, seul l'avatar (aujourd'hui dans `BadgeUtilisateur`) en a besoin : un cercle demande une largeur égale à la hauteur, et Bootstrap n'a pas de taille fixe. On commente le « pourquoi » de cette règle. Accessibilité : le bandeau est un `<header>`, repère que les lecteurs d'écran listent. Les initiales de l'avatar sont masquées (`aria-hidden="true"`), car le nom complet est écrit juste à côté, et sinon il serait lu deux fois. On commence en **HTML statique** (nom écrit en dur) pour valider le design. Les données arriveront avec la feature auth.

Découper en composants : le menu était d'abord écrit dans le header. On l'a déplacé dans le composant dumb `Nav` (`shared/nav/`), et le header l'affiche avec `<app-nav>`. Le header n'importe plus `RouterLinkActive`, qui ne sert qu'au menu, mais il importe `Nav`. Les tests suivent le même découpage : `nav.spec.ts` teste les liens et `aria-current`, `header.spec.ts` vérifie seulement que le menu est présent. Une classe posée sur la balise d'un composant (`<app-nav class="flex-grow-1">`) s'applique à son élément hôte : c'est comme ça que le header lui fait prendre la place libre.

Même démarche pour le logo, extrait dans le composant dumb `Logo` (`shared/logo/`). Question à se poser en découpant : qu'est-ce qui appartient au composant, et qu'est-ce qui dépend de l'endroit où on l'utilise ? Le visuel est toujours le même : il va dans `Logo`. Le lien vers `/entreprises` n'a de sens que dans le header : il reste dans le parent, autour de `<app-logo />`. On pourra ainsi afficher le même logo, non cliquable, sur la page de connexion. Le logo n'a pas de contenu projeté, donc on peut écrire la balise auto-fermante `<app-logo />`.

(`src/app/shared/logo/logo.html`) :

```html
<span class="d-inline-flex align-items-center gap-2">
  <span class="h5 mb-0 px-2 py-1 rounded-3 bg-primary text-white" aria-hidden="true">l</span>
  <span class="h4 mb-0 text-white"
    >liane<span class="text-primary" aria-hidden="true">.</span></span
  >
</span>
```

**Dans notre appli** (`src/app/shared/header/header.html`) :

```html
<header class="d-flex align-items-center gap-4 bg-dark text-white px-4 py-2">
  <a class="navbar-brand me-0" routerLink="/entreprises">
    <app-logo />
  </a>

  <app-nav class="flex-grow-1"></app-nav>

  <app-badge-utilisateur [utilisateur]="utilisateur" />

  <app-button-small libelle="Déconnexion" couleur="light" isOutline (action)="logout()" />
</header>
```

L'avatar, d'abord écrit dans le header, est maintenant dans `BadgeUtilisateur` (voir 3.5), avec sa règle CSS (`src/app/shared/badge-utilisateur/badge-utilisateur.css`) :

```css
/* Bootstrap n'a pas de taille fixe pour un cercle : largeur = hauteur. */
.avatar {
  width: 2.5rem;
  height: 2.5rem;
}
```

**Docs officielles** :
- [Bootstrap : Flex](https://getbootstrap.com/docs/5.3/utilities/flex/)
- [Bootstrap : Buttons](https://getbootstrap.com/docs/5.3/components/buttons/)
- [Bootstrap : Background (`bg-*-subtle`)](https://getbootstrap.com/docs/5.3/utilities/background/)
- [MDN : `<header>`](https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/header)
- [MDN : aria-hidden](https://developer.mozilla.org/fr/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden)
- [Composants Angular : utiliser un composant dans un autre](https://angular.dev/guide/components/importing)

### 3.4 Paramétrer un composant dumb : `input()` et `output()`

**En bref** : un composant dumb reçoit ses données par des **signal inputs** (`input()`) et prévient son parent par des **outputs** (`output()`). Ces fonctions remplacent les décorateurs `@Input()` et `@Output()`.

**Explication** :
- `input.required<string>()` : le parent doit fournir la valeur. Sinon, erreur de compilation.
- `input<string>()` : facultatif, vaut `undefined` si absent.
- `input('primary')` : facultatif avec une valeur par défaut.
- Un input est un signal en lecture seule : on le lit en l'appelant, `libelle()`, dans le template comme dans le code.
- `computed()` calcule une valeur à partir d'autres signals et se met à jour tout seul. Ici, la classe Bootstrap dépend de `couleur()` et de `isOutline()`. Ce n'est pas de la gestion de données (étape 3 de la progression) : c'est de l'affichage dérivé des inputs.
- Pour un booléen, `transform: booleanAttribute` permet d'écrire l'attribut seul (`isOutline`), comme en HTML (`disabled`).
- Un type union (`CouleurBootstrap`) limite les valeurs acceptées : `couleur="rouge"` ne compile pas.
- `output<void>()` déclare un événement sans donnée. On le déclenche avec `emit()`, et le parent l'écoute avec `(action)="…"`.

Pièges et bonnes pratiques :
- Ne pas nommer un output comme un événement natif (`click`) ni le préfixer par `on`. Sinon on ne sait plus si `(click)` vient du composant ou du `<button>`. Un nom trop proche pose le même problème : on avait d'abord appelé l'output `clic`, qu'on confondait à la lecture avec `(click)`. On l'a renommé `action` : le nom ne ressemble à aucun événement du DOM, et il dit que le parent choisit l'action à déclencher.
- Le composant dumb ne décide pas de ce que fait le clic. `ButtonSmall` émet `action`, et c'est le header (méthode `logout()`) qui décide d'y répondre par une déconnexion.
- Sur un même élément, l'attribut `class` et la liaison `[class]` se combinent : on garde les classes fixes dans `class`, la classe calculée dans `[class]`.
- Toujours `type="button"` sur un bouton qui n'envoie pas de formulaire.
- Une icône à côté d'un libellé est décorative : `aria-hidden="true"`.

**Dans notre appli** (`src/app/shared/button-small/button-small.ts`) :

```ts
export class ButtonSmall {
  readonly libelle = input.required<string>();
  readonly icone = input<string>();
  readonly couleur = input<CouleurBootstrap>('primary');
  readonly isOutline = input(false, { transform: booleanAttribute });

  readonly action = output<void>();

  protected readonly classeCouleur = computed(() =>
    this.isOutline() ? `btn-outline-${this.couleur()}` : `btn-${this.couleur()}`,
  );
}
```

(`src/app/shared/button-small/button-small.html`) :

```html
<button
  type="button"
  class="btn btn-sm rounded-pill px-3 fw-semibold"
  [class]="classeCouleur()"
  (click)="action.emit()"
>
  @if (icone()) {
    <span class="me-1" aria-hidden="true">{{ icone() }}</span>
  }
  {{ libelle() }}
</button>
```

Utilisation dans le header, qui réagit à `action` en appelant sa méthode `logout()`, encore vide en attendant la feature auth (`src/app/shared/header/header.html`) :

```html
<app-button-small libelle="Déconnexion" couleur="light" isOutline (action)="logout()" />
```

Autre option, si le header doit rester dumb : il fait remonter l'information à son propre parent avec un output (`readonly deconnexion = output<void>()` et `(action)="deconnexion.emit()"`). C'est alors ce parent qui appelle le service d'authentification.

Autres usages possibles : `<app-button-small libelle="Nouvelle entreprise" icone="+" />` (fond plein `primary`), `<app-button-small libelle="Modifier" icone="✎" couleur="secondary" isOutline />`.

Tester un dumb : on fixe les inputs avec `fixture.componentRef.setInput()`, et on s'abonne à l'output pour vérifier qu'il est émis (`src/app/shared/button-small/button-small.spec.ts`) :

```ts
it('émet action quand on clique sur le bouton', () => {
  let nombreDActions = 0;
  fixture.componentInstance.action.subscribe(() => nombreDActions++);

  bouton().click();

  expect(nombreDActions).toBe(1);
});
```

**Docs officielles** :
- [Inputs (signal inputs)](https://angular.dev/guide/components/inputs)
- [Outputs (`output()`)](https://angular.dev/guide/components/outputs)
- [computed()](https://angular.dev/guide/signals#computed-signals)
- [Bootstrap : Buttons (`btn-outline-*`)](https://getbootstrap.com/docs/5.3/components/buttons/)

### 3.5 Transformer une valeur à l'affichage : pipe personnalisé et `@let`

**En bref** : un **pipe** transforme une valeur dans le template (`{{ nomComplet | initiales }}`). `@let` déclare une variable locale au template, pour ne pas répéter une expression.

**Explication** : pour afficher « CM » à partir de « Chris Martin », on a plusieurs options :
- écrire le calcul dans le template : illisible ;
- une méthode du composant `initiales()` : à éviter dans un template, elle est rappelée à chaque détection de changement ;
- un `computed()` : bien, mais propre à ce composant ;
- un **pipe pur** : c'est le bon choix ici.

Pourquoi le pipe :
- Angular ne le recalcule que si sa valeur d'entrée change (pur par défaut).
- Il est réutilisable partout : avatars de la liste des contacts, des opportunités…
- Il se teste sans TestBed, avec un simple `new InitialesPipe()`.

Un pipe standalone s'importe dans le composant qui l'utilise (`imports: [InitialesPipe]`). Le piège : un pipe ne doit faire que de la mise en forme, sans appel HTTP ni effet de bord.

`@let nomComplet = …;` calcule le nom complet une fois et le réutilise deux fois : dans l'avatar et dans le texte. La variable n'existe que dans le template et se met à jour quand `utilisateur()` change.

**Dans notre appli** (`src/app/shared/pipes/initiales-pipe.ts`) :

```ts
const NOMBRE_MAX_INITIALES = 2;

@Pipe({
  name: 'initiales',
})
export class InitialesPipe implements PipeTransform {
  transform(nomComplet: string): string {
    return nomComplet
      .split(' ')
      .filter((mot) => mot !== '')
      .slice(0, NOMBRE_MAX_INITIALES)
      .map((mot) => mot[0].toUpperCase())
      .join('');
  }
}
```

(`src/app/shared/badge-utilisateur/badge-utilisateur.html`) :

```html
@let nomComplet = utilisateur().prenom + ' ' + utilisateur().nom;

<div class="d-flex align-items-center gap-2">
  <span
    class="avatar d-flex align-items-center justify-content-center rounded-circle fw-bold bg-primary-subtle text-primary-emphasis"
    aria-hidden="true"
    >{{ nomComplet | initiales }}</span
  >
  <div class="lh-sm">
    <div class="fw-semibold">{{ nomComplet }}</div>
  </div>
</div>
```

Le composant reçoit tout l'utilisateur par un seul signal input (`readonly utilisateur = input.required<Utilisateur>();`), et le header le lui passe : `<app-badge-utilisateur [utilisateur]="utilisateur" />`.

Tester un pipe, sans TestBed (`src/app/shared/pipes/initiales-pipe.spec.ts`) :

```ts
const pipe = new InitialesPipe();

it('garde au plus deux initiales', () => {
  expect(pipe.transform('Jean Paul Dupont')).toBe('JP');
});
```

**Docs officielles** :
- [Pipes : créer un pipe personnalisé](https://angular.dev/guide/templates/pipes#creating-custom-pipes)
- [Variables locales avec `@let`](https://angular.dev/guide/templates/variables#local-template-variables-with-let)

### 3.6 Placer et colorer du contenu sur un fond sombre : `my-auto` et `data-bs-theme`

**En bref** : dans une colonne flex, `my-auto` centre un bloc verticalement entre ses voisins. `data-bs-theme="dark"` passe une zone en thème sombre : les couleurs « texte » de Bootstrap y deviennent lisibles sur fond foncé.

**Explication** :
- **Placement** : la colonne gauche de `LayoutSlice` est en `d-flex flex-column`. La page y projette une `<section>`, elle aussi en `d-flex flex-column`, et `flex-grow-1` pour occuper toute la hauteur. Elle contient trois enfants (logo, texte, copyright) : `my-auto` sur celui du milieu prend tout l'espace libre au-dessus et en dessous. Le logo reste en haut, le copyright en bas, le texte au centre, sans CSS. (`mt-auto` seul pousserait un bloc tout en bas.) La `<section aria-label>` sert de repère d'accessibilité (voir 7.1).
- **Couleurs** : `text-body-secondary` et `text-primary-emphasis` sont prévues pour un fond clair. Sur `bg-dark`, elles seraient trop sombres. Posé sur la colonne, `data-bs-theme="dark"` (mode couleur de Bootstrap 5.3) redéfinit les variables CSS de cette zone seulement : `text-body-secondary` devient un gris clair et `text-primary-emphasis` un bleu clair, tous deux au contraste AA.
- **Le piège** : une couleur « vive » sur fond sombre (`text-primary`, `text-danger`) donne souvent un contraste insuffisant pour du petit texte. On vérifie le contraste, et on préfère les variantes `-emphasis` du thème sombre.
- **Réutilisation** : le logo n'est pas recopié, on réutilise le composant `Logo`, non cliquable ici.

**Dans notre appli** (`src/app/Feature-auth/pages/page-auth/page-auth.html`) :

```html
<section slotStart class="d-flex flex-column flex-grow-1" aria-label="Présentation du Mini-CRM">
  <app-logo />

  <div class="my-auto py-5">
    <p class="mb-3 small fw-bold text-uppercase text-primary-emphasis">Mini-CRM</p>
    <h1 class="display-5 fw-bold mb-3 w-75">
      Vos entreprises, contacts et opportunités, au même endroit.
    </h1>
    <p class="mb-0 text-body-secondary">
      Connectez-vous pour retrouver votre portefeuille commercial.
    </p>
  </div>

  <p class="mb-0 small text-body-secondary">© 2026 Liane</p>
</section>
```

**Docs officielles** :
- [Bootstrap : Color modes (`data-bs-theme`)](https://getbootstrap.com/docs/5.3/customize/color-modes/)
- [Bootstrap : Auto margins en flex](https://getbootstrap.com/docs/5.3/utilities/flex/#auto-margins)
- [Bootstrap : Colors (`text-body-secondary`, `text-*-emphasis`)](https://getbootstrap.com/docs/5.3/utilities/colors/)
- [WCAG 2.2 : contraste minimum (1.4.3)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

## 4. HTTP et services

### 4.1 Appeler l'API avec `HttpClient` : un observable froid

**En bref** : un service `@Service()` injecte `HttpClient` et renvoie l'`Observable` de la requête. La requête ne part qu'au moment où quelqu'un s'abonne.

**Explication** :
- `provideHttpClient()` dans `app.config.ts` rend `HttpClient` disponible dans toute l'application. C'est un provider technique global, pas un service de feature.
- Le service injecte `HttpClient` avec `inject()`. On type la réponse (`post<User>(…)`) avec une interface qui suit l'API (voir `endpoints-et-donnees.md`), et on construit l'URL à partir de `environment.apiBaseUrl`.
- **Étape 1 de la progression** : le service ne s'abonne pas. Il renvoie l'observable, et c'est la page qui décide quand l'exécuter (`subscribe`, ou pipe `async`).
- Un observable de `HttpClient` est **froid** : rien ne se passe tant qu'on ne s'y abonne pas, et chaque nouvel abonnement relance une nouvelle requête. Le piège : appeler `creerUnCompte(…)` sans `subscribe()` n'envoie rien. À l'inverse, s'abonner deux fois crée deux comptes.
- Une erreur HTTP (400, 401…) arrive dans le callback `error` de l'abonnement, pas dans le `next`.

**Dans notre appli** (`src/app/Feature-auth/data-access/auth-service.ts`) :

```ts
@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  creerUnCompte(register: Register): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/auth/register`, register)
      .pipe(tap((session) => this.enregistrerSession(session)));
  }
}
```

(Le `tap` qui enregistre la session est expliqué en 4.2.)

**Tester un service HTTP** : `provideHttpClient()` + `provideHttpClientTesting()` remplacent le vrai réseau. `HttpTestingController` vérifie la requête (URL, méthode, corps) et renvoie une réponse simulée avec `flush()`. `verify()` dans `afterEach` échoue s'il reste une requête non traitée. Le premier test prouve que l'observable est froid (`src/app/Feature-auth/data-access/auth-service.spec.ts`) :

```ts
it("n'envoie aucune requête tant qu'on ne s'abonne pas", () => {
  service.creerUnCompte(nouveauCompte);

  httpTesting.expectNone(`${environment.apiBaseUrl}/auth/register`);
});

it('envoie les données du compte en POST sur /auth/register', () => {
  service.creerUnCompte(nouveauCompte).subscribe();

  const requete = httpTesting.expectOne(`${environment.apiBaseUrl}/auth/register`);

  expect(requete.request.method).toBe('POST');
  expect(requete.request.body).toEqual(nouveauCompte);
  requete.flush(reponseApi);
});
```

**Docs officielles** :
- [HttpClient : mise en place](https://angular.dev/guide/http/setup)
- [HttpClient : faire des requêtes](https://angular.dev/guide/http/making-requests)
- [Tester les requêtes HTTP](https://angular.dev/guide/http/testing)
- [RxJS : Observable](https://rxjs.dev/guide/observable)

### 4.2 Garder un état partagé dans un service : `BehaviorSubject` (observable chaud)

> **Version d'origine** : la session de `AuthService` a ensuite été basculée en `signal()` (voir 4.5). L'extrait ci-dessous est l'« avant », conservé pour comprendre la différence.

**En bref** : un `BehaviorSubject` garde une **valeur courante** et la diffuse à tous ses abonnés. C'est un observable **chaud**, à l'inverse de l'observable froid de `HttpClient`.

**Explication** :

| Observable froid (`HttpClient`) | Observable chaud (`BehaviorSubject`) |
|---|---|
| Ne fait rien sans abonné | Existe et garde sa valeur même sans abonné |
| Chaque abonnement relance le travail (une nouvelle requête) | Tous les abonnés partagent la même valeur |
| Un abonné tardif relance tout | Un abonné tardif reçoit tout de suite la **dernière** valeur |

Pour la session de l'utilisateur (token + profil), il faut une valeur courante, que le header, le guard et l'interceptor liront plus tard : c'est un `BehaviorSubject`.
- **Encapsulation** : le `BehaviorSubject` est **privé** (lui seul a `next()`), et on expose `session$ = this.session.asObservable()`, qu'on peut lire mais pas modifier. Le `$` final est la convention pour nommer un observable.
- **`tap()`** exécute un effet de bord (enregistrer la session) sans modifier la valeur qui passe. Il ne s'exécute qu'en cas de succès : sur une erreur HTTP, rien n'est enregistré.
- **Valeur initiale lue dans le `localStorage`** : la session survit à un rafraîchissement de la page. On protège le `JSON.parse` par un `try/catch`, car une valeur abîmée ne doit pas casser le démarrage.
- **Le piège** : le `localStorage` est lisible par tout script de la page. Une faille XSS permettrait de voler le token. C'est acceptable en formation ; en production, on préfère souvent un cookie `HttpOnly`.

**Dans notre appli** (`src/app/Feature-auth/data-access/auth-service.ts`) :

```ts
const CLE_SESSION = 'mini-crm.session';

@Service()
export class AuthService {
  // Observable chaud : garde la session courante et la partage entre tous les abonnés.
  private readonly session = new BehaviorSubject<User | null>(lireSessionStockee());
  readonly session$ = this.session.asObservable();

  connexion(identifiants: Login): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/auth/login`, identifiants)
      .pipe(tap((session) => this.enregistrerSession(session)));
  }

  deconnexion(): void {
    localStorage.removeItem(CLE_SESSION);
    this.session.next(null);
  }

  private enregistrerSession(session: User): void {
    localStorage.setItem(CLE_SESSION, JSON.stringify(session));
    this.session.next(session);
  }
}
```

**Docs officielles** :
- [RxJS : BehaviorSubject](https://rxjs.dev/api/index/class/BehaviorSubject)
- [RxJS : tap](https://rxjs.dev/api/operators/tap)
- [MDN : localStorage](https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage)

### 4.3 Consommer un observable dans une page : le pipe `async`

**En bref** : le pipe `async` s'abonne à un observable depuis le template, affiche sa dernière valeur et se désabonne tout seul quand le composant est détruit ou que l'observable change.

**Explication** : la page ne fait pas de `subscribe` manuel. Elle prépare un observable, `envoi$`, et le template s'y abonne avec `@let resultat = envoi$ | async;`. C'est cet abonnement qui déclenche la requête (observable froid). À chaque nouvel envoi, on affecte un **nouvel** observable à `envoi$` : le pipe `async` se désabonne de l'ancien et s'abonne au nouveau.

Les opérateurs transforment la réponse en ce dont l'écran a besoin :
- `tap` : effet de bord en cas de succès (naviguer vers `/entreprises`) ;
- `map` : transforme la réponse en résultat d'affichage (`{ erreur: null }`) ;
- `catchError` : intercepte l'erreur HTTP et la remplace par une valeur (`of({ erreur: message })`). L'observable ne « casse » pas, et la page affiche un message lisible au lieu de rien.

Tant que l'API n'a pas répondu, `resultat` vaut `null` : `envoi$ !== null && resultat === null` dit qu'un envoi est en cours, et le bouton est désactivé. Le piège : sans `catchError`, une erreur HTTP termine l'observable en erreur, et le pipe `async` la relance dans la console.

**Dans notre appli** (`src/app/Feature-auth/pages/page-auth/page-auth.ts`) :

```ts
// Observable froid : la requête part quand le pipe async du template s'y abonne.
protected envoi$: Observable<ResultatEnvoi> | null = null;

protected seConnecter(identifiants: Login): void {
  this.envoi$ = this.suivreEnvoi(this.authService.connexion(identifiants));
}

private suivreEnvoi(envoi: Observable<User>): Observable<ResultatEnvoi> {
  return envoi.pipe(
    tap(() => this.router.navigateByUrl(PAGE_APRES_CONNEXION)),
    map(() => ({ erreur: null })),
    catchError((erreur: HttpErrorResponse) => of({ erreur: messageErreur(erreur) })),
  );
}
```

(`src/app/Feature-auth/pages/page-auth/page-auth.html`) :

```html
@let resultat = envoi$ | async;
<main slotEnd class="w-100 d-flex justify-content-center">
  <app-form-auth
    [erreur]="resultat?.erreur ?? null"
    [isEnvoiEnCours]="envoi$ !== null && resultat === null"
    (connexion)="seConnecter($event)"
    (inscription)="creerUnCompte($event)"
  />
</main>
```

**Afficher ou masquer selon un observable : `@if (… | async; as …)`** (version d'origine du header, remplacée par un signal en 4.5). Le header lisait directement la session du service. `as session` donne un nom à la valeur reçue, réutilisable dans le bloc. Comme un `BehaviorSubject` émet tout de suite sa valeur courante, puis chaque changement, le badge et le bouton apparaissent à la connexion et disparaissent à la déconnexion, sans autre code (`src/app/shared/header/header.html`) :

```html
@if (authService.session$ | async; as session) {
  <app-badge-utilisateur [utilisateur]="session.user" />

  <app-button-small libelle="Déconnexion" couleur="light" isOutline (action)="logout()" />
}
```

Le service est injecté en `protected` (`protected readonly authService = inject(AuthService)`) pour être lisible depuis le template sans être exposé au reste du code. Pour tester, le faux service expose un `BehaviorSubject` : `session.next(null)` dans le test simule une déconnexion.

Tester une page smart : on remplace le service par un faux (`{ provide: AuthService, useValue: fauxAuthService }`), qui renvoie `of(session)` ou `throwError(…)`. On déclenche l'output du formulaire, puis on vérifie l'appel, la navigation et le message (`page-auth.spec.ts`).

**Docs officielles** :
- [AsyncPipe](https://angular.dev/api/common/AsyncPipe)
- [RxJS : catchError](https://rxjs.dev/api/operators/catchError)
- [RxJS : map](https://rxjs.dev/api/operators/map)

### 4.4 Formulaire réactif avec `FormBuilder`

**En bref** : un formulaire réactif est décrit dans la classe (`FormGroup`, `FormControl`, validateurs) et relié au template par `[formGroup]` et `formControlName`. `FormBuilder` raccourcit son écriture.

**Explication** :
- La feature auth utilise volontairement les formulaires réactifs « classiques », qu'on trouve dans la plupart des projets existants. Les autres formulaires utiliseront les **Signal Forms**, la nouvelle API.
- `NonNullableFormBuilder` crée des contrôles qui reviennent à `''` (et non à `null`) après un `reset()`, ce qui garde un typage strict (`string`).
- **Validateurs** : `Validators.required`, `Validators.email`, `Validators.minLength(6)`. Un contrôle **désactivé** est ignoré par la validation et absent de `value`. On s'en sert pour ne valider le prénom et le nom qu'en mode inscription. `getRawValue()` lit tout, y compris les contrôles désactivés.
- **Envoi** : `(ngSubmit)` sur le `<form>`. Si le formulaire est invalide, `markAllAsTouched()` affiche toutes les erreurs ; sinon, le composant dumb émet les données par un `output()`. Il n'appelle jamais le service lui-même.
- **Accessibilité** : erreur affichée seulement quand le champ est `touched` (pas dès l'arrivée sur la page), reliée au champ par `aria-describedby` et signalée par `aria-invalid`. `novalidate` désactive les bulles natives du navigateur au profit de nos messages.
- Astuce : `@let email = formulaire.controls.email;` dans le template évite de répéter `formulaire.controls.email` partout, et reste lisible.

**Dans notre appli** (`src/app/Feature-auth/ui/form-auth/form-auth.ts`) :

```ts
// Prénom et nom ne servent qu'à l'inscription : désactivés, ils sont ignorés par la validation.
protected readonly formulaire = this.formBuilder.group({
  prenom: [{ value: '', disabled: true }, Validators.required],
  nom: [{ value: '', disabled: true }, Validators.required],
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(LONGUEUR_MIN_MOT_DE_PASSE)]],
});

protected valider(): void {
  if (this.formulaire.invalid) {
    this.formulaire.markAllAsTouched();
    return;
  }
  const { prenom, nom, email, password } = this.formulaire.getRawValue();
  if (this.isConnexion()) {
    this.connexion.emit({ email, password });
    return;
  }
  this.inscription.emit({ email, password, nom, prenom });
}
```

(`src/app/Feature-auth/ui/form-auth/form-auth.html`, extrait) :

```html
@let email = formulaire.controls.email;
@let isEmailInvalide = email.invalid && email.touched;

<form [formGroup]="formulaire" (ngSubmit)="valider()" novalidate>
  <label for="email" class="form-label fw-semibold">Adresse e-mail</label>
  <input
    id="email"
    type="email"
    class="form-control"
    formControlName="email"
    autocomplete="email"
    [class.is-invalid]="isEmailInvalide"
    [attr.aria-invalid]="isEmailInvalide"
    [attr.aria-describedby]="isEmailInvalide ? 'email-erreur' : null"
  />
  @if (isEmailInvalide) {
    <div id="email-erreur" class="invalid-feedback">Saisissez une adresse e-mail valide.</div>
  }
</form>
```

**Docs officielles** :
- [Formulaires réactifs](https://angular.dev/guide/forms/reactive-forms)
- [Formulaires typés](https://angular.dev/guide/forms/typed-forms)
- [Valider les saisies](https://angular.dev/guide/forms/form-validation)
- [Bootstrap : validation des formulaires](https://getbootstrap.com/docs/5.3/forms/validation/)

### 4.5 Avant / après : du `BehaviorSubject` au `signal()` pour un état partagé

**En bref** : un `signal()` remplace avantageusement un `BehaviorSubject` pour garder une valeur courante dans un service. On le lit en l'appelant (`session()`), sans abonnement ni pipe `async`.

**Explication** : exercice de bascule sur la session de `AuthService`. On garde exactement le même principe : valeur courante, privée en écriture, publique en lecture. Seules les API changent :

| `BehaviorSubject` (avant) | `signal()` (après) |
|---|---|
| `new BehaviorSubject<User \| null>(valeur)` | `signal<User \| null>(valeur)` |
| `session.next(valeur)` | `sessionCourante.set(valeur)` |
| `readonly session$ = session.asObservable()` | `readonly session = sessionCourante.asReadonly()` |
| Lecture : `session$ \| async` (abonnement) | Lecture : `session()` (appel de fonction) |
| `AsyncPipe` à importer dans le composant | Rien à importer |
| Valeur synchrone : `session.value` (déconseillé) | `session()` partout, dans le code comme dans le template |

Pourquoi c'est plus simple :
- plus d'abonnement, donc rien à désabonner ;
- la même lecture `session()` partout : dans le template, dans un `computed()`, dans le code d'un guard ;
- Angular sait exactement quels templates lisent le signal, et ne met à jour qu'eux (zoneless).

Ce qui ne change pas : les **requêtes HTTP** restent des observables. `connexion()` renvoie toujours `Observable<User>`, et `tap()` y écrit dans le signal. Un signal garde une **valeur** ; un observable décrit un **flux d'événements dans le temps** (une réponse HTTP qui arrivera plus tard). Le piège : vouloir tout transformer en signal. Pour lire des données HTTP en signals, on utilisera `httpResource()` à l'étape 3.

Pour les tests, le faux service expose un `signal()` au lieu d'un `BehaviorSubject`, et `session.set(null)` simule une déconnexion.

**Dans notre appli**, avant (`src/app/Feature-auth/data-access/auth-service.ts`) :

```ts
private readonly session = new BehaviorSubject<User | null>(lireSessionStockee());
readonly session$ = this.session.asObservable();

private enregistrerSession(session: User): void {
  localStorage.setItem(CLE_SESSION, JSON.stringify(session));
  this.session.next(session);
}
```

Après :

```ts
// Seul le service modifie la session ; le reste de l'application la lit en lecture seule.
private readonly sessionCourante = signal<User | null>(lireSessionStockee());
readonly session = this.sessionCourante.asReadonly();

private enregistrerSession(session: User): void {
  localStorage.setItem(CLE_SESSION, JSON.stringify(session));
  this.sessionCourante.set(session);
}
```

Header, avant / après (`src/app/shared/header/header.html`) :

```html
<!-- avant : abonnement par le pipe async (AsyncPipe importé dans le composant) -->
@if (authService.session$ | async; as session) { … }

<!-- après : lecture du signal -->
@if (authService.session(); as session) { … }
```

**Docs officielles** :
- [Signals](https://angular.dev/guide/signals)
- [Signals en lecture seule (`asReadonly`)](https://angular.dev/api/core/WritableSignal)
- [RxJS interop (quand mélanger observables et signals)](https://angular.dev/ecosystem/rxjs-interop)

### 4.6 Ajouter le token à toutes les requêtes : un interceptor HTTP

**En bref** : un interceptor est une fonction qui voit passer **toutes** les requêtes de `HttpClient`. On s'en sert pour ajouter le header `Authorization: Bearer <token>` à un seul endroit, au lieu de le répéter dans chaque service.

**Explication** :
- **Signature** : un interceptor fonctionnel (`HttpInterceptorFn`) reçoit la requête `req` et la suite `next`, et renvoie `next(req)`. Ne rien faire, c'est `return next(req);`.
- **Immuabilité** : une `HttpRequest` ne se modifie pas. On en crée une copie modifiée avec `req.clone({ headers: req.headers.set('Authorization', …) })`, puis on passe la copie à `next`.
- **`inject()` fonctionne dans un interceptor** : il s'exécute dans le contexte d'injection de l'application. On y lit le token de la session à **chaque** requête : s'il change (connexion, déconnexion), la requête suivante prend le bon.
- **Enregistrement** : `provideHttpClient(withInterceptors([jwtInterceptor]))` dans `app.config.ts`. S'il y en a plusieurs, ils s'exécutent dans l'ordre du tableau.
- **Le piège de sécurité** : ajouter le token à toutes les requêtes, y compris vers d'autres sites (une API publique, un CDN…), offre le token à des tiers. On ne l'ajoute que si l'URL commence par `environment.apiBaseUrl`.
- Pas de session : on laisse passer la requête telle quelle. C'est l'API qui répondra 401, et un guard évitera d'y arriver.

**Dans notre appli** (`src/app/shared/jwt-interceptor.ts`) :

```ts
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
```

(`src/app/app.config.ts`) :

```ts
provideHttpClient(withInterceptors([jwtInterceptor])),
```

**Tester un interceptor** : on l'enregistre comme dans l'application (`provideHttpClient(withInterceptors([jwtInterceptor]))` + `provideHttpClientTesting()`), on remplace `AuthService` par un faux qui expose un `signal()`, on fait une vraie requête avec `HttpClient`, puis on lit les headers de la requête interceptée (`src/app/shared/jwt-interceptor.spec.ts`) :

```ts
it("n'envoie jamais le token vers un autre domaine", () => {
  http.get(URL_AUTRE_DOMAINE).subscribe();

  const requete = httpTesting.expectOne(URL_AUTRE_DOMAINE);

  expect(requete.request.headers.has('Authorization')).toBe(false);
  requete.flush({});
});
```

**Docs officielles** :
- [Interceptors](https://angular.dev/guide/http/interceptors)
- [Tester les requêtes HTTP](https://angular.dev/guide/http/testing)
- [MDN : header Authorization](https://developer.mozilla.org/fr/docs/Web/HTTP/Reference/Headers/Authorization)

### 4.7 Traiter les erreurs HTTP en un seul endroit : un interceptor d'erreurs

**En bref** : un interceptor peut aussi regarder passer la **réponse**, avec `next(req).pipe(tap(…))`. Le callback `error` de `tap` permet de réagir à certains codes d'erreur, une seule fois pour toute l'application.

**Explication** :
- On part de l'exemple `loggingInterceptor` de la doc officielle (section « Intercepting response events ») : une `function` qui reçoit `req` et `next`, et renvoie `next(req).pipe(tap(…))`.
- `tap` accepte un objet `{ next, error }`. Le callback `error` est appelé quand la requête échoue : on y teste le code avec de simples `if`.
- `tap` **ne fait que regarder** : l'erreur continue son chemin jusqu'à la page, qui affiche son propre message. Pas besoin de `catchError` ni de `throwError`.
- **401** : le token est absent ou expiré, donc on déconnecte et on renvoie vers `/connexion`. **Piège** : sur `/auth/login`, un 401 veut dire « mauvais mot de passe », d'où le `!req.url.includes('/auth/')`.
- **500** : erreur côté serveur, confiée à l'`ErrorHandler` d'Angular avec `errorHandler.handleError(erreur)`. C'est le gestionnaire d'erreurs global de l'application (par défaut, il affiche l'erreur dans la console). En le remplaçant par notre propre classe, on pourra envoyer toutes les erreurs vers un outil de suivi, sans toucher à l'interceptor. Bonne pratique : ne pas éparpiller des `console.error` dans le code.
- **`inject()`** se fait au début de la fonction : le callback `error` s'exécute plus tard, quand la réponse arrive, en dehors du contexte d'injection.
- **Ordre** : `withInterceptors([jwtInterceptor, errorsInterceptor])`. La requête traverse les interceptors dans l'ordre du tableau, et la réponse revient dans l'ordre inverse.

Exemple de la doc, point de départ :

```ts
export function loggingInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    tap((event) => {
      if (event.type === HttpEventType.Response) {
        console.log(req.url, 'returned a response with status', event.status);
      }
    }),
  );
}
```

**Dans notre appli** (`src/app/shared/errors-interceptor.ts`) :

```ts
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
```

**Tester** : on simule une réponse en erreur avec `flush(corps, { status: 401, statusText: '…' })`, on vérifie avec un faux `AuthService` que `deconnexion()` est appelée, et avec un faux `ErrorHandler` (`{ provide: ErrorHandler, useValue: { handleError: vi.fn() } }`) que le 500 lui est confié (`src/app/shared/errors-interceptor.spec.ts`).

**Docs officielles** :
- [Interceptors : Intercepting response events (exemple `next(req).pipe(tap(…))`)](https://angular.dev/guide/http/interceptors#intercepting-response-events)
- [Interceptors : Dependency injection in interceptors](https://angular.dev/guide/http/interceptors#dependency-injection-in-interceptors)
- [RxJS : tap (callbacks `next` et `error`)](https://rxjs.dev/api/operators/tap)
- [ErrorHandler](https://angular.dev/api/core/ErrorHandler)

### 4.8 Un service CRUD et une liste affichée avec le pipe `async`

> **Version d'origine** : la lecture de la liste a ensuite été basculée en `httpResource()` (voir 4.11). Les extraits de `lister()` et du template ci-dessous sont l'« avant ».

**En bref** : un service de données expose une méthode par opération de l'API (lister, trouver, créer, modifier, supprimer), chacune renvoie un `Observable`. La page affiche la liste avec le pipe `async`, sans `subscribe` manuel.

**Explication** :
- **Une méthode = un endpoint**, nommée en français métier (`lister`, `trouver`, `creer`, `modifier`, `supprimer`). On type la réponse (`get<Entreprise[]>`) avec une interface qui suit l'API. Le type `EntrepriseInput` décrit ce qu'on envoie : c'est `Entreprise` sans l'`id` (voir 4.9).
- **Le service ne s'abonne jamais** : il ne sait pas quand ni combien de fois les données seront lues. Le token est ajouté par l'interceptor : le service n'a pas à s'en occuper.
- **Observable froid, démonstration** : deux `subscribe()` sur le même `lister()` envoient **deux** requêtes (voir le test). Dans un template, il faut donc lire `entreprises$` **une seule fois** : `@let entreprises = entreprises$ | async;` en haut du template, puis on réutilise `entreprises` partout. Écrire `entreprises$ | async` deux fois enverrait deux requêtes.
- **Trois états à afficher** :
  - pendant le chargement, `entreprises` vaut `null` : `@if … @else` affiche « Chargement… » ;
  - liste vide : `@for … @empty` ;
  - liste remplie : `@for (… ; track entreprise.id)`. Le `track` sur l'`id` permet à Angular de ne recréer que les lignes qui changent.
- **Accessibilité d'un tableau** : `<caption>` (masquée visuellement avec `visually-hidden`), `<th scope="col">`, messages de chargement en `aria-live="polite"`.
- **Le piège** : sans gestion d'erreur, une erreur HTTP laisse « Chargement… » affiché. On l'ajoutera avec `catchError`, comme dans la page de connexion (4.3).

**Dans notre appli** (`src/app/Feature-entreprises/data-access/entreprises-service.ts`) :

```ts
// Observables froids : chaque méthode ne fait rien tant que personne ne s'y abonne.
@Service()
export class EntreprisesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/entreprises`;

  lister(): Observable<Entreprise[]> {
    return this.http.get<Entreprise[]>(this.apiUrl);
  }

  trouver(id: number): Observable<Entreprise> {
    return this.http.get<Entreprise>(`${this.apiUrl}/${id}`);
  }

  creer(entreprise: EntrepriseInput): Observable<Entreprise> {
    return this.http.post<Entreprise>(this.apiUrl, entreprise);
  }

  modifier(id: number, entreprise: EntrepriseInput): Observable<Entreprise> {
    return this.http.put<Entreprise>(`${this.apiUrl}/${id}`, entreprise);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

(`src/app/Feature-entreprises/pages/page-entreprises/page-entreprises.ts`) :

```ts
// Observable froid : la requête part quand le pipe async du template s'y abonne.
protected readonly entreprises$ = this.entreprisesService.lister();
```

(`src/app/Feature-entreprises/pages/page-entreprises/page-entreprises.html`, extrait) :

```html
@let entreprises = entreprises$ | async;

<app-layout-pages>
  @if (entreprises) {
    <table class="table table-hover align-middle mb-0">
      <caption class="visually-hidden">Liste des entreprises</caption>
      <tbody>
        @for (entreprise of entreprises; track entreprise.id) {
          <tr>…</tr>
        } @empty {
          <tr><td colspan="3">Aucune entreprise.</td></tr>
        }
      </tbody>
    </table>
  } @else {
    <p aria-live="polite">Chargement des entreprises…</p>
  }
</app-layout-pages>
```

Le test qui prouve qu'un observable froid relance la requête à chaque abonnement (`entreprises-service.spec.ts`) :

```ts
it('relance une requête à chaque abonnement (observable froid)', () => {
  const entreprises$ = service.lister();

  entreprises$.subscribe();
  entreprises$.subscribe();

  const requetes = httpTesting.match(URL_ENTREPRISES);
  expect(requetes.length).toBe(2);
  requetes.forEach((requete) => requete.flush([]));
});
```

Pour tester la page, le faux service renvoie `of(entreprises)`, ou un `Subject` qu'on fait émettre plus tard pour vérifier le message de chargement.

**Docs officielles** :
- [HttpClient : faire des requêtes](https://angular.dev/guide/http/making-requests)
- [AsyncPipe](https://angular.dev/api/common/AsyncPipe)
- [Contrôle de flux : `@for`, `track`, `@empty`](https://angular.dev/guide/templates/control-flow)
- [Bootstrap : Tables](https://getbootstrap.com/docs/5.3/content/tables/)
- [MDN : `<caption>`](https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/caption)

### 4.9 Dériver un type d'un autre : `Omit`

**En bref** : `Omit<Type, 'cle'>` crée un nouveau type à partir d'un type existant, en retirant une ou plusieurs propriétés.

**Explication** :
- Ce qu'on **envoie** pour créer une entreprise est presque ce qu'on **reçoit** : il manque juste l'`id`, généré par l'API. Plutôt que de recopier tous les champs dans une deuxième interface, on écrit `Omit<Entreprise, 'id'>`.
- **Avantage** : une seule source de vérité. Si on ajoute un champ à `Entreprise` (par exemple `siteWeb?`), `EntrepriseInput` le reçoit automatiquement.
- `Omit` produit un **type**, pas une interface : on l'écrit avec `type … =`. Pour l'utiliser, rien ne change (`creer(entreprise: EntrepriseInput)`).
- On peut retirer plusieurs champs : `Omit<Opportunite, 'id' | 'statut'>`. Son contraire est `Pick<Type, 'a' | 'b'>`, qui ne garde que les champs listés. Autre utilitaire courant : `Partial<Type>`, qui rend tous les champs facultatifs (pratique pour un `PUT` partiel).
- **Le piège** : si les deux modèles divergent vraiment (un champ envoyé n'existe pas dans la réponse, ou n'a pas le même type), `Omit` ne convient plus. On écrit alors une interface séparée.

**Dans notre appli** (`src/app/Feature-entreprises/models/entreprise-input.ts`) :

```ts
import { Entreprise } from './entreprise';

// Mêmes champs qu'Entreprise, sans l'id : c'est l'API qui le génère à la création.
export type EntrepriseInput = Omit<Entreprise, 'id'>;
```

Avant, on avait recopié les champs à la main :

```ts
export interface EntrepriseInput {
  nom: string;
  secteur?: string;
  adresse?: string;
  telephone?: string;
}
```

**Docs officielles** :
- [TypeScript : Omit<Type, Keys>](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)
- [TypeScript : Utility Types (Pick, Partial…)](https://www.typescriptlang.org/docs/handbook/utility-types.html)

### 4.10 Agir sur une ligne : lien « Modifier », bouton « Supprimer » et rechargement

> Depuis la bascule en `httpResource()` (4.11), le rechargement après suppression se fait avec `entreprises.reload()` au lieu de remplacer l'observable. L'extrait ci-dessous est l'« avant ».

**En bref** : pour une action ponctuelle (supprimer), la page s'abonne elle-même avec `subscribe()` et `takeUntilDestroyed()`. Pour recharger la liste, on remplace l'observable lu par le pipe `async`.

**Explication** :
- **Lien ou bouton ?** « Modifier » et « Ajouter une entreprise » mènent à une autre page : c'est une **navigation**, donc un `<a [routerLink]>` (clic droit, nouvel onglet et clavier fonctionnent). « Supprimer » déclenche une **action** : c'est un `<button type="button">`. Les deux peuvent avoir le même style Bootstrap (`btn btn-sm …`).
- **Nommer chaque action** : dans un tableau, un lecteur d'écran entendrait dix fois « Supprimer » sans savoir laquelle. On ajoute le nom de l'entreprise en texte masqué : `Supprimer <span class="visually-hidden">{{ entreprise.nom }}</span>`. Le texte visible ne change pas.
- **Titre et action principale sur une ligne** : dans l'en-tête, `d-flex justify-content-between align-items-center` place le titre à gauche et « + Ajouter une entreprise » (`btn btn-primary`, la couleur de l'action principale) à droite. `flex-wrap gap-3` les empile proprement sur petit écran.
- **Confirmer une action destructive** : `confirm()` du navigateur suffit pour commencer (accessible, au clavier). On le remplacera plus tard par une modale.
- **S'abonner dans la page** : la suppression n'affiche rien, il n'y a donc pas de pipe `async` pour s'abonner. On appelle `subscribe()`. `takeUntilDestroyed(this.destroyRef)` coupe l'abonnement si la page est détruite avant la réponse. C'est la bonne pratique de l'étape 1 pour un `subscribe` manuel.
- **Recharger la liste** : on affecte un **nouvel** observable à `entreprises$`. Le pipe `async` se désabonne de l'ancien et s'abonne au nouveau, ce qui relance le GET (observable froid). `entreprises$` n'est donc plus `readonly`. Plus tard, un état partagé (`BehaviorSubject` ou signal) évitera de recharger toute la liste.
- **Le piège** : appeler `supprimer(id)` sans `subscribe()` n'envoie rien du tout (observable froid).
- **Tester** : `vi.spyOn(window, 'confirm').mockReturnValue(true)` simule la confirmation (`false` simule l'annulation). On vérifie que `supprimer` est appelé avec le bon `id` et que `lister` est rappelé.

**Dans notre appli** (`src/app/Feature-entreprises/pages/page-entreprises/page-entreprises.ts`) :

```ts
// Observable froid : la requête part quand le pipe async du template s'y abonne.
protected entreprises$ = this.entreprisesService.lister();

protected supprimer(entreprise: Entreprise): void {
  if (!confirm(`Supprimer l'entreprise ${entreprise.nom} ?`)) {
    return;
  }
  this.entreprisesService
    .supprimer(entreprise.id)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => this.recharger());
}

// Un nouvel observable : le pipe async s'y abonne, ce qui relance la requête GET.
private recharger(): void {
  this.entreprises$ = this.entreprisesService.lister();
}
```

(`page-entreprises.html`, colonne Actions) :

```html
<td class="text-end text-nowrap">
  <a
    class="btn btn-sm btn-outline-secondary rounded-pill fw-semibold me-2"
    [routerLink]="['/entreprises', entreprise.id, 'modifier']"
  >
    <span aria-hidden="true">✎</span> Modifier
    <span class="visually-hidden">{{ entreprise.nom }}</span>
  </a>
  <button
    type="button"
    class="btn btn-sm btn-outline-danger rounded-pill fw-semibold"
    (click)="supprimer(entreprise)"
  >
    Supprimer <span class="visually-hidden">{{ entreprise.nom }}</span>
  </button>
</td>
```

**Docs officielles** :
- [takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed)
- [RouterLink avec paramètres](https://angular.dev/guide/routing/navigate-to-routes)
- [MDN : window.confirm()](https://developer.mozilla.org/fr/docs/Web/API/Window/confirm)
- [Bootstrap : visually-hidden](https://getbootstrap.com/docs/5.3/helpers/visually-hidden/)

### 4.11 Avant / après : lire une liste avec `httpResource()`

> **Étape suivante** : la page liste lit maintenant l'état dans un NgRx Signal Store (voir 8.1). `lister()` (`httpResource`) reste dans le service comme exemple, et les extraits de la page ci-dessous sont une étape intermédiaire.

**En bref** : `httpResource()` lance une requête GET et expose le résultat sous forme de **signals** : `value()`, `hasValue()`, `isLoading()`, `error()`, plus `reload()` pour relancer. Plus de pipe `async`, plus d'abonnement.

**Explication** :
- **Ce que ça remplace** : le trio `Observable` + `@let … | async` + `@if/@else` pour gérer « chargement / données », et la réaffectation de l'observable pour recharger.
- **Pas froid, mais immédiat** : la requête part dès que la ressource est créée, et non au premier abonnement.
- **Contexte d'injection obligatoire** : `httpResource()` doit être appelé là où `inject()` est permis. L'initialisation d'une propriété de composant convient (`protected readonly entreprises = this.entreprisesService.lister();`), un clic non.
- **Le type change** : la méthode ne renvoie plus `Observable<Entreprise[]>` mais `HttpResourceRef<Entreprise[] | undefined>` (`undefined` tant que rien n'est chargé). C'était l'erreur de la première tentative : le type de retour `Observable` était resté, et il y avait un accent grave en trop dans `() => this.apiUrl`.
- **Piège** : lire `value()` quand la ressource est en erreur **lève une exception**. Dans le template, on teste dans l'ordre `error()`, puis `hasValue()`, et seulement ensuite `value()`.
- **Recharger** : `entreprises.reload()`. Pendant le rechargement, `hasValue()` reste vrai : l'ancienne liste reste affichée, sans clignotement.
- **Les écritures n'utilisent pas `httpResource`**, qui sert à **lire** des données. Elles passent ensuite par `firstValueFrom` (voir 4.12).
- **Tester** : la requête en attente est une tâche en cours, donc `await fixture.whenStable()` attendrait la réponse indéfiniment. On utilise `TestBed.tick()` pour afficher la page et envoyer la requête, on répond avec `HttpTestingController` (`flush`), puis on attend `whenStable()`. Dans un test de service, on crée la ressource avec `TestBed.runInInjectionContext(() => service.lister())`.

**Avant** (`entreprises-service.ts` et `page-entreprises.ts`) :

```ts
lister(): Observable<Entreprise[]> {
  return this.http.get<Entreprise[]>(this.apiUrl);
}

// dans la page
protected entreprises$ = this.entreprisesService.lister();
// recharger : this.entreprises$ = this.entreprisesService.lister();
```

```html
@let entreprises = entreprises$ | async;
@if (entreprises) { …tableau… } @else { Chargement… }
```

**Après** (`src/app/Feature-entreprises/data-access/entreprises-service.ts`) :

```ts
// httpResource lance la requête tout de suite et expose des signals (value, isLoading, error).
// À appeler dans un contexte d'injection (ex. initialisation d'une propriété de composant).
lister(): HttpResourceRef<Entreprise[] | undefined> {
  return httpResource<Entreprise[]>(() => this.apiUrl);
}
```

(`page-entreprises.ts`) :

```ts
// Ressource HTTP : la requête part dès la création, le template lit ses signals.
protected readonly entreprises = this.entreprisesService.lister();

// après la suppression (version 4.12 : await puis reload)
await this.entreprisesService.supprimer(entreprise.id);
this.entreprises.reload();
```

(`page-entreprises.html`, extrait) :

```html
@if (entreprises.error()) {
  <div class="alert alert-danger m-3" role="alert">
    Impossible de charger les entreprises. Réessayez plus tard.
  </div>
} @else if (entreprises.hasValue()) {
  @for (entreprise of entreprises.value(); track entreprise.id) { … }
} @else {
  <p aria-live="polite">Chargement des entreprises…</p>
}
```

Test de la page (`page-entreprises.spec.ts`) :

```ts
// Pas de whenStable ici : la requête de httpResource est en attente tant qu'on n'y répond pas.
// tick() affiche la page et déclenche l'envoi de la requête.
TestBed.tick();

httpTesting.expectOne(URL_ENTREPRISES).flush(entreprises);
await fixture.whenStable();
```

**Docs officielles** :
- [httpResource](https://angular.dev/guide/http/http-resource)
- [Resource (signals asynchrones)](https://angular.dev/guide/signals/resource)
- [Tester les requêtes HTTP](https://angular.dev/guide/http/testing)

### 4.12 Écrire avec `firstValueFrom`, relire avec `reload()` : l'API, seule source de vérité

> **Étape suivante** : avec le Signal Store (8.1), c'est le store qui relit la liste (`charger()`) après chaque écriture, et la page n'appelle plus `reload()`. Le principe reste le même : l'API est la seule source de vérité. Les écritures du service (`firstValueFrom`) n'ont pas changé.

**En bref** : `firstValueFrom()` transforme l'observable de `HttpClient` en `Promise`, qu'on attend avec `await`. Après une écriture, on ne modifie jamais la liste à la main : on la **relit sur l'API** avec `reload()`.

**Explication** :
- **`firstValueFrom(obs$)`** s'abonne tout de suite, prend la première valeur émise et renvoie une `Promise`. Une requête HTTP n'émet qu'une valeur : c'est exactement ce qu'il faut pour un `POST`, un `PUT` ou un `DELETE`. Le code se lit de haut en bas, avec `async/await`, sans `subscribe` ni `takeUntilDestroyed`.
- **Différence avec l'observable froid** : la requête part **à l'appel** de la méthode, pas à l'abonnement. Une erreur HTTP **rejette** la promesse : on la récupère avec `try/catch`, ou on la laisse remonter au gestionnaire d'erreurs global.
- **Application multi-utilisateur : l'API est la seule source de vérité.** Pendant qu'un utilisateur supprime une entreprise, un collègue peut en créer une autre. Si la page retirait seulement la ligne supprimée dans une liste gardée en mémoire, elle afficherait un état faux. Après chaque écriture réussie, on appelle donc `reload()` sur la ressource, et la liste affichée est **toujours la dernière réponse de l'API**.
- **Le service ne garde aucun état** : pas de signal `entreprises`, pas de `update()` sur une liste. Ses méthodes ne font que parler à l'API. C'est la ressource (dans la page) qui porte les données lues.
- **Le piège** : faire `liste.filter(…)` ou `[...liste, nouvelle]` après une écriture. C'est rapide et ça paraît plus fluide, mais la liste devient une copie locale qui diverge de l'API. On l'appelle « optimistic update » : c'est une optimisation avancée, à réserver aux cas où on sait gérer les conflits.
- **Tester une `Promise`** : on garde la promesse (`const suppression = service.supprimer(1);`), on répond à la requête (`flush`), puis on vérifie avec `await`, `resolves` ou `rejects`. Dans un test de page, après le `flush` du `DELETE`, la suite de la méthode `async` (le `reload()`) s'exécute plus tard. On la laisse finir (`await new Promise((resolve) => setTimeout(resolve))`), puis `TestBed.tick()` envoie le nouveau `GET`, auquel on répond.

**Avant** (Observable, gardé en commentaire dans le service) :

```ts
supprimer(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}

// dans la page
this.entreprisesService
  .supprimer(entreprise.id)
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(() => this.entreprises.reload());
```

**Après** (`src/app/Feature-entreprises/data-access/entreprises-service.ts`) :

```ts
supprimer(id: number): Promise<void> {
  return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
}
```

(`page-entreprises.ts`) :

```ts
// Après la suppression, on relit la liste sur l'API (elle a pu changer pour d'autres raisons).
protected async supprimer(entreprise: Entreprise): Promise<void> {
  if (!confirm(`Supprimer l'entreprise ${entreprise.nom} ?`)) {
    return;
  }
  await this.entreprisesService.supprimer(entreprise.id);
  this.entreprises.reload();
}
```

Le test qui montre l'intérêt de relire l'API (`page-entreprises.spec.ts`) :

```ts
it("affiche la liste de l'API, même si un autre utilisateur l'a changée entre-temps", async () => {
  boutonSupprimer('TechVision').click();
  httpTesting.expectOne(`${URL_ENTREPRISES}/1`).flush(null);
  await laisserFinirLesPromesses();
  TestBed.tick();

  const ajouteeParUnCollegue: Entreprise = { id: 3, nom: 'ShopNow', secteur: 'E-commerce' };
  await repondre([entreprises[1], ajouteeParUnCollegue]);

  expect(element.textContent).toContain('ShopNow');
  expect(element.querySelectorAll('tbody tr').length).toBe(2);
});
```

**Docs officielles** :
- [RxJS : firstValueFrom](https://rxjs.dev/api/index/function/firstValueFrom)
- [httpResource (`reload()`)](https://angular.dev/guide/http/http-resource)
- [MDN : async / await](https://developer.mozilla.org/fr/docs/Learn_web_development/Extensions/Async_JS/Promises)

## 5. Formulaires

### 5.1 Un premier formulaire en Signal Forms

**En bref** : avec les Signal Forms (`@angular/forms/signals`), le formulaire est construit à partir d'un **signal** qui contient les données. `form(modele)` crée le formulaire, et la directive `FormField` relie chaque `<input>` à un champ, dans les deux sens.

**Explication** :
- **Le modèle est la source de vérité** : un `signal` (ici un `linkedSignal`) qui contient l'objet du formulaire. Taper dans un champ met à jour le modèle, et changer le modèle met à jour les champs. On lit toutes les valeurs avec `modele()`.
- **`form(modele)`** crée un arbre de champs qui suit la forme de l'objet : `formulaire.nom`, `formulaire.secteur`… On le crée à l'initialisation d'une propriété (contexte d'injection).
- **`[formField]="formulaire.nom"`** sur l'`<input>` fait la liaison. On importe la directive `FormField` dans le composant. Pas de `formControlName` ni de `FormBuilder`.
- **Comparaison avec le formulaire réactif de la connexion (4.4)** : là-bas, les valeurs vivent dans des `FormControl` qu'on lit avec `getRawValue()`. Ici, elles vivent dans un simple signal typé.
- **Un formulaire pour l'ajout et la modification** : le composant dumb reçoit une entreprise facultative en `input`. `linkedSignal` recalcule le modèle à partir de cet input chaque fois qu'il change : vide pour l'ajout, prérempli pour la modification, même si l'entreprise arrive après le chargement. Le modèle reste modifiable par l'utilisateur.
- **Des chaînes partout** : un champ vide vaut `''`, pas `undefined`. On type donc le modèle avec `Required<EntrepriseInput>` (tous les champs obligatoires), et on part d'un objet vide complété par l'entreprise reçue (`{ ...ENTREPRISE_VIDE, ...this.entreprise() }`).
- **Soumission, au plus simple** : `(submit)` sur le `<form>`, `event.preventDefault()` pour éviter le rechargement de la page, et le composant émet `modele()` par un `output`. C'est la page smart qui appelle le service. La validation est ajoutée en 5.2.
- **Accessibilité** : chaque champ a son `<label for>`, un `id` unique (préfixé `entreprise-`) et un `autocomplete` adapté (`organization`, `street-address`, `tel`).
- **Le piège** : oublier d'importer `FormField`. Le template compile alors une liaison `[formField]` inconnue, et le champ n'est relié à rien.
- **Statut de l'API** : les Signal Forms sont récents (Angular v21+, marqués « New » dans la doc). Vérifier sur angular.dev si l'API est encore expérimentale dans la version utilisée.

**Dans notre appli** (`src/app/Feature-entreprises/ui/form-entreprise/form-entreprise.ts`) :

```ts
// Tous les champs en chaîne : un champ de formulaire vide vaut '' (et non undefined).
type ModeleEntreprise = Required<EntrepriseInput>;

const ENTREPRISE_VIDE: ModeleEntreprise = { nom: '', secteur: '', adresse: '', telephone: '' };

export class FormEntreprise {
  // Vide pour un ajout, préremplie pour une modification.
  readonly entreprise = input<EntrepriseInput>();
  readonly libelleValider = input('Enregistrer');

  readonly valider = output<EntrepriseInput>();

  // Le modèle repart de l'entreprise reçue à chaque fois qu'elle change (ex. chargée après coup).
  protected readonly modele = linkedSignal<ModeleEntreprise>(() => ({
    ...ENTREPRISE_VIDE,
    ...this.entreprise(),
  }));

  // Le modèle reste la source de vérité : les champs le lisent et l'écrivent.
  protected readonly formulaire = form(this.modele);

  protected soumettre(event: Event): void {
    event.preventDefault();
    this.valider.emit(this.modele());
  }
}
```

(`form-entreprise.html`, extrait) :

```html
<form novalidate (submit)="soumettre($event)">
  <label for="entreprise-nom" class="form-label fw-semibold">Nom</label>
  <input
    id="entreprise-nom"
    type="text"
    class="form-control"
    autocomplete="organization"
    [formField]="formulaire.nom"
  />
  …
  <button type="submit" class="btn btn-primary rounded-pill fw-semibold px-4">
    {{ libelleValider() }}
  </button>
</form>
```

La page d'ajout (`page-ajouter-entreprise.ts`) : elle attend la création, puis revient à la liste, qui relit l'API.

```ts
protected async ajouter(entreprise: EntrepriseInput): Promise<void> {
  this.hasError.set(false);
  try {
    await this.entreprisesService.creer(entreprise);
    await this.router.navigateByUrl(PAGE_LISTE);
  } catch {
    this.hasError.set(true);
  }
}
```

**Tester** : on remplit un champ comme un utilisateur (`input.value = …` puis `dispatchEvent(new Event('input'))`), on attend `whenStable()`, on clique sur le bouton d'envoi et on vérifie l'`output` émis. Pour la modification, `setInput('entreprise', …)` doit préremplir les champs.

**Docs officielles** :
- [Signal Forms : vue d'ensemble](https://angular.dev/guide/forms/signals/overview)
- [Signal Forms : modèles de formulaire](https://angular.dev/guide/forms/signals/models)
- [Signal Forms : soumission](https://angular.dev/guide/forms/signals/form-submission)
- [linkedSignal](https://angular.dev/guide/signals/linked-signal)
- [MDN : attribut autocomplete](https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Attributes/autocomplete)

### 5.2 Valider un Signal Form et afficher les erreurs

**En bref** : les règles de validation se déclarent dans un **schéma**, une fonction passée en 2e argument de `form()`. Chaque champ expose ensuite son état sous forme de signals : `touched()`, `invalid()`, `errors()`.

**Explication** :
- **Le schéma** reçoit les chemins des champs (`schema.nom`, `schema.telephone`…). On y appelle les règles intégrées : `required`, `minLength`, `maxLength`, `pattern`, `email`… Chaque règle accepte un objet `{ message }` : le message d'erreur à afficher, en français. Les limites sont des constantes nommées (`LONGUEUR_MIN_NOM`), jamais des nombres magiques.
- **Un champ facultatif avec un format** : `pattern` sur le téléphone. Un champ vide reste valide, puisque seul `required` impose une valeur.
- **Lire l'état d'un champ** : `formulaire.nom()` donne l'état du champ. `@let nom = formulaire.nom();` en haut du template évite de répéter l'appel. On affiche l'erreur quand le champ est **touché et invalide** : l'utilisateur ne voit pas d'erreur avant d'avoir interagi.
- **Afficher les messages** : `errors()` renvoie la liste des règles non respectées, chacune avec un `kind` (`required`, `minLength`…) et le `message` défini dans le schéma. On les parcourt avec `@for (erreur of nom.errors(); track erreur.kind)`.
- **Accessibilité** : `is-invalid` (style Bootstrap), `aria-invalid="true"` et `aria-describedby` vers le bloc d'erreur, pour que le lecteur d'écran lise le message en arrivant sur le champ. Le champ obligatoire a un astérisque **décoratif** (`aria-hidden`), expliqué en toutes lettres en haut du formulaire, et `aria-required="true"`. L'information ne passe pas par la couleur seule.
- **Soumettre avec `submit()`** : `submit(this.formulaire, async () => { … })` marque tous les champs comme touchés, donc toutes les erreurs s'affichent d'un coup. Il **n'exécute l'action que si toutes les règles sont respectées** : le composant n'émet jamais de données invalides.
- **Le piège** : dans le schéma, chaque règle est une **instruction** à part, terminée par un point-virgule, et le minimum de `minLength` est obligatoire. Écrire `required(schema.nom), minLength(schema.nom)` (une virgule, sans minimum) ne compile pas.
- **Tester** : une erreur doit apparaître seulement après interaction (`blur` ou clic sur « valider »). On vérifie le message relié au champ par `aria-describedby`, `aria-invalid`, et que rien n'est émis quand le formulaire est invalide. Comme `submit()` lance son action de façon asynchrone, on attend après le clic.

**Dans notre appli** (`src/app/Feature-entreprises/ui/form-entreprise/form-entreprise.ts`) :

```ts
const LONGUEUR_MIN_NOM = 2;
const LONGUEUR_MAX_TEXTE = 100;
// Téléphone français : 10 chiffres commençant par 0, espaces facultatifs (ex. 01 45 67 89 00).
const FORMAT_TELEPHONE = /^0\d( ?\d{2}){4}$/;

// Le modèle reste la source de vérité ; le schéma (2e argument) déclare les règles de validation.
protected readonly formulaire = form(this.modele, (schema) => {
  required(schema.nom, { message: 'Le nom est obligatoire.' });
  minLength(schema.nom, LONGUEUR_MIN_NOM, {
    message: `Le nom doit faire au moins ${LONGUEUR_MIN_NOM} caractères.`,
  });
  maxLength(schema.nom, LONGUEUR_MAX_TEXTE, {
    message: `Le nom doit faire au plus ${LONGUEUR_MAX_TEXTE} caractères.`,
  });
  maxLength(schema.secteur, LONGUEUR_MAX_TEXTE, {
    message: `Le secteur doit faire au plus ${LONGUEUR_MAX_TEXTE} caractères.`,
  });
  pattern(schema.telephone, FORMAT_TELEPHONE, {
    message: 'Saisissez un numéro à 10 chiffres, par exemple 01 45 67 89 00.',
  });
});

// submit() marque les champs comme touchés (les erreurs s'affichent)
// et n'exécute l'action que si toutes les règles sont respectées.
protected soumettre(event: Event): void {
  event.preventDefault();
  submit(this.formulaire, async () => {
    this.valider.emit(this.modele());
  });
}
```

(`form-entreprise.html`, le champ « Nom ») :

```html
@let nom = formulaire.nom();
@let isNomInvalide = nom.touched() && nom.invalid();

<label for="entreprise-nom" class="form-label fw-semibold">
  Nom <span class="text-danger" aria-hidden="true">*</span>
</label>
<input
  id="entreprise-nom"
  type="text"
  class="form-control"
  autocomplete="organization"
  aria-required="true"
  [formField]="formulaire.nom"
  [class.is-invalid]="isNomInvalide"
  [attr.aria-invalid]="isNomInvalide"
  [attr.aria-describedby]="isNomInvalide ? 'entreprise-nom-erreur' : null"
/>
@if (isNomInvalide) {
  <div id="entreprise-nom-erreur" class="invalid-feedback">
    @for (erreur of nom.errors(); track erreur.kind) {
      <div>{{ erreur.message }}</div>
    }
  </div>
}
```

**Comparaison avec le formulaire réactif (4.4)** : `Validators.required` dans `FormBuilder` devient `required(schema.nom, { message })` dans le schéma. Les messages sont déclarés avec la règle au lieu d'être écrits dans le template. `email.invalid && email.touched` devient `nom.invalid() && nom.touched()` (des signals). `markAllAsTouched()` est fait par `submit()`.

**Docs officielles** :
- [Signal Forms : validation](https://angular.dev/guide/forms/signals/validation)
- [Signal Forms : soumission (`submit`)](https://angular.dev/guide/forms/signals/form-submission)
- [Bootstrap : validation des formulaires](https://getbootstrap.com/docs/5.3/forms/validation/)
- [WAI : identifier les erreurs de saisie](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)

### 5.3 Modifier une entreprise : lire l'id dans l'URL, charger, préremplir le formulaire

**En bref** : la page de modification lit l'`id` dans l'URL, charge l'entreprise sur l'API, puis la passe au **même** formulaire que l'ajout, qui se préremplit grâce à `linkedSignal`.

**Explication** :
- **Paramètre de route** : la route `entreprises/:id/modifier` déclare un paramètre `:id`. Dans la page, `inject(ActivatedRoute).snapshot.paramMap.get('id')` lit sa valeur au moment de l'arrivée sur la page. Un paramètre d'URL est toujours une **chaîne** : on le convertit avec `Number()`.
- **`snapshot` suffit ici** : on ne reste pas sur la page en changeant d'`id` (on revient à la liste après l'enregistrement). Si la même page devait afficher plusieurs `id` à la suite, il faudrait suivre le paramètre au fil du temps.
- **Charger au démarrage** : le constructeur appelle `charger()`, une méthode `async` qui attend `trouver(id)` et range la réponse de l'API dans un signal. Ce signal ne contient qu'une réponse de l'API, jamais une copie qu'on modifierait à la main.
- **`@if (entreprise(); as entrepriseChargee)`** : on n'affiche le formulaire qu'une fois l'entreprise arrivée. `as` donne un nom à la valeur, et TypeScript sait qu'elle n'est plus `undefined` dans le bloc. Avant cela, on affiche « Chargement… », et en cas d'échec un message `role="alert"`.
- **Un formulaire, deux pages** : le formulaire est le même que pour l'ajout. Seuls changent l'`input` `entreprise` (absent pour l'ajout, prérempli ici) et le libellé du bouton. Son `linkedSignal` recalcule le modèle quand l'entreprise arrive.
- **Après l'enregistrement** : `await modifier(id, …)`, puis retour à la liste, qui relit l'API (nouvelle ressource).
- **Tester** : on simule la route active (`{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } } }`) et le service (`trouver`, `modifier` en `vi.fn()`, qui renvoient des promesses). Une promesse qui ne se résout jamais (`new Promise(() => undefined)`) simule un chargement en cours.
- **Commentaires ligne par ligne** : toute la feature entreprises est commentée en détail, pour servir de référence de lecture. Dans un vrai projet, on ne commente que le « pourquoi » non évident.

**Dans notre appli** (`src/app/Feature-entreprises/pages/page-modifier-entreprise/page-modifier-entreprise.ts`, extrait) :

```ts
// L'id de l'entreprise, lu une fois dans l'URL. snapshot = l'état de la route à l'arrivée ;
// paramMap.get('id') renvoie une chaîne, Number() la convertit en nombre.
private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

// L'entreprise telle que l'API l'a renvoyée (undefined tant qu'elle n'est pas chargée).
protected readonly entreprise = signal<Entreprise | undefined>(undefined);

constructor() {
  this.charger();
}

private async charger(): Promise<void> {
  try {
    this.entreprise.set(await this.entreprisesService.trouver(this.id));
  } catch {
    this.hasErrorChargement.set(true);
  }
}
```

(`page-modifier-entreprise.html`, extrait) :

```html
@if (hasErrorChargement()) {
  <div class="alert alert-danger mb-0" role="alert">
    Impossible de charger cette entreprise. Elle a peut-être été supprimée.
  </div>
} @else if (entreprise(); as entrepriseChargee) {
  <app-form-entreprise
    libelleValider="Enregistrer"
    [entreprise]="entrepriseChargee"
    (valider)="enregistrer($event)"
  />
} @else {
  <p class="text-secondary mb-0" aria-live="polite">Chargement de l'entreprise…</p>
}
```

**Docs officielles** :
- [Lire les paramètres de route](https://angular.dev/guide/routing/read-route-state)
- [ActivatedRoute](https://angular.dev/api/router/ActivatedRoute)
- [Contrôle de flux : `@if` avec `as`](https://angular.dev/guide/templates/control-flow)
- [linkedSignal](https://angular.dev/guide/signals/linked-signal)

## 6. Tests unitaires

### 6.1 Écrire un test : d'abord « ce qu'il faut tester », puis Arrange / Act / Assert

**En bref** : avant d'écrire un test, on liste les **comportements visibles** à vérifier (ce qui s'affiche, ce qui est émis, ce qui est appelé, ce qui est renvoyé), et ce qu'on ne teste pas. Chaque test suit ensuite trois étapes : **Arrange** (préparer), **Act** (agir), **Assert** (vérifier).

**Explication** :
- **Commencer par la liste « Ce qu'il faut tester »**, en commentaire en tête du fichier. Pour un guard : ce qu'il renvoie selon la session. Pour un formulaire : ce qui est émis, les erreurs affichées. Pour un service HTTP : la requête envoyée et ce qui est renvoyé. On y écrit aussi ce qu'on ne teste **pas** : l'implémentation interne (quels opérateurs, quelle méthode privée). Un bon test survit à une réécriture du code tant que le comportement ne change pas.
- **Puis la stratégie** : quelles dépendances remplacer par des faux, et comment.
  - **Composant dumb** : `setInput()` pour les entrées, un espion sur l'`output`.
  - **Page smart** : un faux service, `{ provide: XService, useValue: faux }`.
  - **Service HTTP** : `provideHttpClientTesting()` + `HttpTestingController`, et `verify()` à la fin.
  - **Pipe** : `new MonPipe()`, sans TestBed.
  - **Composant avec `ng-content`** : un composant hôte de test.
  - **Guard ou fonction qui utilise `inject()`** : `TestBed.runInInjectionContext()`.
- **Arrange / Act / Assert** : trois commentaires dans chaque test, qui rendent la lecture immédiate. Un test vérifie **un** comportement, et son nom en français le décrit (`it("redirige vers /connexion quand il n'y a pas de session")`).
- **Sélectionner comme un utilisateur** : par libellé, texte, rôle ou balise sémantique (`header`, `main`), pas par classe CSS ni par position (`querySelector('a')` prend « le premier lien venu » et casse si l'ordre change).
- **Tests indépendants** : on recrée les faux services dans `beforeEach` (ou dans chaque test) au lieu de partager une constante remise à zéro par `mockReset`. Aucun test ne doit dépendre d'un autre.

**Pièges relevés en relisant les tests du mini-CRM** :
- **Un test qui ne prouve rien** : vérifier que `slotStart` s'affiche avant `slotEnd` alors que le composant hôte les écrit déjà dans cet ordre ne teste rien. On les écrit dans l'ordre **inverse** pour prouver que c'est le composant qui range. Même idée pour le token de l'interceptor : il faut une requête, puis changer la session, puis une deuxième requête.
- **Un test squelette** (`it('should create')`) ne vérifie presque rien. On le garde seulement pour un composant encore vide, avec un commentaire qui dit pourquoi.
- **Providers oubliés** : un composant qui contient `<router-outlet>` ou des `routerLink` a besoin de `provideRouter([])` dans son test (« No provider found for ActivatedRoute »).
- **Asynchrone** :
  - avec `httpResource`, une requête en attente empêche `whenStable()` de se terminer : `TestBed.tick()` pour l'envoyer, `flush` pour répondre, **puis** `whenStable()` ;
  - après un `flush` qui termine une fonction `async` (`await firstValueFrom(…)`), on laisse les promesses finir (`await new Promise((resolve) => setTimeout(resolve))`) ;
  - `submit()` des Signal Forms lance son action plus tard : on attend après le clic.
- **Apostrophe dans le nom d'un test** : `it('l'entreprise…')` casse la chaîne. On écrit `it("l'entreprise…")`.

**Dans notre appli** (`src/app/Feature-auth/data-access/auth-guard.spec.ts`, extrait) :

```ts
/*
 * Ce qu'il faut tester dans authGuard
 * -----------------------------------
 * Un guard `canActivate` répond à une seule question : « l'utilisateur a-t-il le droit d'entrer
 * sur cette route ? ». Son comportement visible, c'est donc uniquement sa valeur de retour :
 *  - avec une session ouverte, il renvoie `true` : la navigation continue ;
 *  - sans session, il renvoie un `UrlTree` vers `/connexion` : le routeur redirige l'utilisateur
 *    vers la page de connexion au lieu d'afficher la page protégée.
 * On ne teste PAS la façon dont il s'y prend (quels services il injecte, dans quel ordre) :
 * seulement « ce qui entre » (une session ou pas) et « ce qui sort » (true ou une redirection).
 */

it("redirige vers /connexion quand il n'y a pas de session", () => {
  // Arrange : personne n'est connecté.
  configurer(null);
  // On récupère le Router de TestBed pour fabriquer l'URL attendue et lire le résultat.
  const router = TestBed.inject(Router);

  // Act : le routeur interroge le guard.
  const resultat = executerGuard();

  // Assert : le guard renvoie bien un UrlTree (une redirection), pas true ni false…
  expect(resultat).toBeInstanceOf(UrlTree);
  // … et cet UrlTree, converti en texte, correspond à l'URL /connexion.
  expect(router.serializeUrl(resultat as UrlTree)).toBe(
    router.serializeUrl(router.parseUrl('/connexion')),
  );
});
```

Tous les fichiers `.spec.ts` du projet suivent ce modèle et sont commentés ligne par ligne. Ce sont des exemples à lire en parallèle du code testé.

**Docs officielles** :
- [Tests dans Angular : vue d'ensemble](https://angular.dev/guide/testing)
- [Tester les composants](https://angular.dev/guide/testing/components-basics)
- [Tester les services](https://angular.dev/guide/testing/services)
- [Tester les requêtes HTTP](https://angular.dev/guide/http/testing)
- [Vitest : API (expect, vi.fn, vi.spyOn)](https://vitest.dev/api/)

## 7. Tests e2e avec Playwright

### 7.1 Installer Playwright et tester un parcours utilisateur

**En bref** : un test e2e pilote un **vrai navigateur** sur la **vraie application**, comme un utilisateur : il clique, tape, et vérifie ce qui s'affiche. On l'utilise pour les **parcours complets** (se connecter, ajouter une entreprise…), et on laisse le détail aux tests unitaires.

**Explication** :
- **Installation** : `npm install --save-dev @playwright/test @axe-core/playwright`, puis `npx playwright install` pour les navigateurs de test (Chromium, Firefox, WebKit). Tout est détaillé pour les apprenants dans `playwright.md`, à la racine du projet.
- **Configuration** (`playwright.config.ts`) :
  - `testDir: './e2e'` ;
  - `baseURL` pour écrire `page.goto('/connexion')` ;
  - un **projet par navigateur** ;
  - `webServer`, qui lance `npm start` tout seul avant les tests.
- **Ce qu'il faut tester** : commencer, comme en unitaire, par un bloc de commentaire qui liste les parcours à vérifier et ce qu'on ne teste pas. Puis Arrange / Act / Assert dans chaque test.
- **Localisateurs accessibles** : `getByRole('button', { name: 'Se connecter' })`, `getByLabel('Adresse e-mail')`, `getByText(…)`. On trouve les éléments comme un utilisateur ou un lecteur d'écran. Jamais par classe CSS ni XPath.
  - **Piège** : `getByLabel('Nom')` trouve aussi « Prénom », car par défaut il cherche un texte **contenu** dans le libellé. On ajoute `{ exact: true }`.
  - **Piège** : un libellé « Nom * » ne correspond plus exactement à « Nom ». On utilise le **nom accessible** : `getByRole('textbox', { name: 'Nom', exact: true })`, qui ignore l'astérisque en `aria-hidden`.
- **Assertions « web-first »** : `await expect(page).toHaveURL('/entreprises')`, `await expect(locator).toBeVisible()`… réessaient automatiquement jusqu'à ce que la condition soit vraie (5 secondes par défaut). On n'écrit **jamais** de pause fixe (`waitForTimeout`) : trop courte, le test échoue au hasard ; trop longue, il est lent.
- **Chaque test est indépendant** : Playwright donne à chaque test un onglet neuf (`{ page }`). Les données viennent d'une fausse API créée dans `beforeEach`.
- **Simuler l'API avec `page.route()`** : l'application croit parler à la vraie API. Les tests ne touchent pas aux données réelles, partagées entre stagiaires, et donnent toujours le même résultat. On peut aussi simuler une panne (erreur 500) pour tester l'affichage d'erreur.
- **Se connecter une seule fois** : un projet `setup` se connecte par le formulaire et enregistre l'état du navigateur (`storageState`, qui contient le `localStorage` où l'application garde la session). Les autres projets le rechargent et démarrent connectés. Les tests de connexion repartent d'un état vide : `test.use({ storageState: { cookies: [], origins: [] } })`.
- **Boîtes `confirm()`** : Playwright les refuse par défaut. `page.once('dialog', (dialogue) => dialogue.accept())` répond « OK » à la prochaine.
- **Accessibilité automatique** : `new AxeBuilder({ page }).analyze()` audite la page, et on attend `violations` vide. Dans le mini-CRM, axe a trouvé de vrais problèmes sur la page de connexion :
  - des contrastes insuffisants ;
  - du contenu hors repère.

  Ils ont été corrigés dans l'application, pas en assouplissant le test.

**Dans notre appli** (`e2e/entreprises.spec.ts`, extrait) :

```ts
test('ajoute une entreprise et la retrouve dans la liste', async ({ page }) => {
  // Arrange : on part de la liste et on clique sur « Ajouter une entreprise »
  // (c'est un lien : rôle « link »).
  await page.goto('/entreprises');
  await page.getByRole('link', { name: 'Ajouter une entreprise' }).click();
  await expect(page).toHaveURL('/entreprises/ajouter');

  // Act : on remplit le formulaire et on valide.
  await champNom(page).fill('DataCorp');
  await page.getByLabel('Secteur').fill('Data & IA');
  await page.getByLabel('Téléphone').fill('05 67 89 01 23');
  await page.getByRole('button', { name: 'Ajouter' }).click();

  // Assert : retour à la liste, qui affiche la nouvelle entreprise (relue sur l'API)…
  await expect(page).toHaveURL('/entreprises');
  await expect(ligne(page, 'DataCorp')).toContainText('Data & IA');
  await expect(page.getByText('3 entreprise(s) affichée(s)')).toBeVisible();
});
```

La fausse API (`e2e/support/fausse-api.ts`, extrait) :

```ts
// Branche la fausse API sur la page. À appeler AVANT page.goto(), sinon les premières
// requêtes partiraient vers la vraie API.
async brancher(): Promise<void> {
  // « ** » : toutes les URL qui commencent par l'adresse de l'API.
  await this.page.route(`${URL_API}/**`, (route) => this.repondre(route));
}
```

**Commandes** : `npm run e2e` (3 navigateurs), `npm run e2e:chromium` (rapide), `npm run e2e:ui` (pas à pas, le plus pédagogique), `npm run e2e:report`, `npm run e2e:codegen` (enregistre vos clics et génère le code).

**Docs officielles** :
- [Playwright : installation](https://playwright.dev/docs/intro)
- [Écrire des tests](https://playwright.dev/docs/writing-tests)
- [Localisateurs](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Authentification (setup, storageState)](https://playwright.dev/docs/auth)
- [Simuler une API (page.route)](https://playwright.dev/docs/mock)
- [Tests d'accessibilité](https://playwright.dev/docs/accessibility-testing)
- [WCAG 2.2 : contraste minimum (1.4.3)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

## 8. NgRx Signal Store

### 8.1 Rassembler l'état d'une feature dans un Signal Store

**En bref** : un **store** rassemble au même endroit l'état d'une feature (les données, le chargement, l'erreur), les valeurs calculées et les actions. Avec **NgRx Signal Store** (`@ngrx/signals`), il se construit avec des signals, en quelques couches : `withState`, `withComputed`, `withMethods`.

**Explication** :
- **Pourquoi** : sans store, chaque page gérait son propre état de liste (une ressource dans la liste, des appels directs au service dans les formulaires). Avec un store, les pages ne font plus que **lire** des signals (`store.entreprises()`) et **appeler** des actions (`store.supprimer(id)`). L'état est au même endroit, testé une fois.
- **Installation** : `npm install @ngrx/signals`. Les versions de NgRx suivent celles d'Angular (22 pour Angular 22). Aucune configuration dans `app.config.ts` : `providedIn: 'root'` suffit. Le guide de la feature, `src/app/Feature-entreprises/ngrx-signal-store.md`, détaille tout pour les apprenants.
- **`signalStore(...)`** crée une **classe** injectable : on l'injecte avec `inject(EntreprisesStore)`, comme un service.
- **Les couches, dans l'ordre** :
  - **`withState(ETAT_INITIAL)`** : chaque champ devient un signal en **lecture seule** pour l'extérieur. Une page ne peut pas écrire dans l'état : elle doit passer par une action ;
  - **`withComputed`** : des valeurs dérivées, recalculées toutes seules (`nombre`) ;
  - **`withMethods`** : les actions. On y utilise `inject()` pour récupérer le service, et **`patchState(store, { … })`** pour mettre à jour une partie de l'état (les autres champs ne bougent pas).
- **Service et store, deux rôles** : le **service parle à l'API** (HTTP), le **store garde l'état** et orchestre. Le store appelle le service ; on ne supprime pas le service.
- **Le piège** : `httpResource` doit être créé dans un contexte d'injection, ce qui n'est pas le cas d'une méthode du store. Le store utilise donc une méthode du service qui renvoie une `Promise` (`chargerListe()`, avec `firstValueFrom`).
- **Règle du projet, multi-utilisateur** : le store ne modifie **jamais** la liste à la main (pas de `[...liste, nouvelle]`, pas de `filter` après une suppression). Après chaque écriture, il appelle `charger()` et la liste redevient la réponse de l'API.
- **Store partagé** (`providedIn: 'root'`) : la liste chargée par une page reste disponible pour les autres. La page liste appelle quand même `store.charger()` à chaque arrivée, pour ne pas afficher une liste périmée.
- **Tester** :
  - **le store**, avec un **faux service** : `{ chargerListe: vi.fn().mockResolvedValue([...]) }`, puis `TestBed.inject(EntreprisesStore)`. On vérifie les signals après chaque action, et que les écritures relisent la liste ;
  - **une page**, avec un **faux store** : `{ provide: EntreprisesStore, useValue: { ajouter: vi.fn() } }` ;
  - **le partage du store, en e2e** : comme le store garde la liste entre les pages, un test e2e vérifie qu'en revenant sur la liste **en naviguant** (clics sur des liens, sans recharger l'application), on voit les changements faits entre-temps par un collègue. On a vérifié que ce test **échoue** si la page ne recharge qu'une fois (`if (store.nombre() === 0) store.charger()`) : un test doit être capable de détecter le bug qu'il protège.

**Dans notre appli** (`src/app/Feature-entreprises/data-access/entreprises-store.ts`, extrait) :

```ts
export const EntreprisesStore = signalStore(
  // providedIn: 'root' : une seule instance, partagée par toute l'application (comme
  // @Service()). La liste chargée par une page est donc visible par les autres pages.
  { providedIn: 'root' },

  // 1. L'état : chaque champ devient un signal en lecture seule pour l'extérieur :
  //    store.entreprises(), store.isLoading(), store.erreur().
  withState(ETAT_INITIAL),

  // 2. Les valeurs calculées : elles se mettent à jour toutes seules quand l'état change.
  withComputed(({ entreprises }) => ({
    nombre: computed(() => entreprises().length),
  })),

  // 3. Les méthodes : les actions que les pages appellent.
  withMethods((store, entreprisesService = inject(EntreprisesService)) => {
    async function charger(): Promise<void> {
      patchState(store, { isLoading: true, erreur: null });
      try {
        const entreprises = await entreprisesService.chargerListe();
        // L'état prend exactement la réponse de l'API : c'est elle, la source de vérité.
        patchState(store, { entreprises });
      } catch {
        patchState(store, { erreur: MESSAGE_ERREUR_CHARGEMENT });
      } finally {
        patchState(store, { isLoading: false });
      }
    }

    return {
      charger,
      async supprimer(id: number): Promise<void> {
        await entreprisesService.supprimer(id);
        await charger();
      },
      // ajouter, modifier : même principe
    };
  }),
);
```

Dans la page liste, **avant / après** :

```ts
// Avant : la page créait sa propre ressource et la rechargeait.
protected readonly entreprises = this.entreprisesService.lister();
await this.entreprisesService.supprimer(entreprise.id);
this.entreprises.reload();

// Après : la page lit le store et appelle ses actions.
protected readonly store = inject(EntreprisesStore);
await this.store.supprimer(entreprise.id);
```

```html
@for (entreprise of store.entreprises(); track entreprise.id) { … }
<p>{{ store.nombre() }} entreprise(s) affichée(s)</p>
```

**Docs officielles** :
- [NgRx Signals : vue d'ensemble](https://ngrx.io/guide/signals)
- [NgRx Signals : installation](https://ngrx.io/guide/signals/install)
- [SignalStore](https://ngrx.io/guide/signals/signal-store)
- [Signals dans Angular](https://angular.dev/guide/signals)
