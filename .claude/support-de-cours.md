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
3. [Les composants](#3-les-composants) (la notion 3.2 est un exercice pour le moment)
4. [HTTP et services](#4-http-et-services)

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

Utilisation dans la page de connexion. Plusieurs éléments peuvent viser le même slot : ils s'affichent dans l'ordre où la page les écrit, et un composant peut lui-même porter l'attribut (`<app-logo slotStart />`). Mise en page de la colonne en 3.6 (`src/app/Feature-auth/pages/page-auth/page-auth.html`) :

```html
<app-layout-slice>
  <app-logo slotStart />

  <div slotStart class="my-auto py-5">…accroche, titre, sous-titre…</div>

  <p slotStart class="mb-0 small text-body-secondary">© 2026 Liane</p>

  <div slotEnd>formulaire</div>
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

> **Exercice, pour le moment** : `LayoutPages` est un corrigé d'exercice. Il n'est pas encore utilisé dans l'application, et l'exemple d'utilisation ci-dessous est une illustration.

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
- **Placement** : la colonne gauche de `LayoutSlice` est en `d-flex flex-column`. Avec trois enfants (logo, texte, copyright), `my-auto` sur celui du milieu prend tout l'espace libre au-dessus et en dessous. Le logo reste en haut, le copyright en bas, le texte au centre, sans CSS. (`mt-auto` seul pousserait un bloc tout en bas.)
- **Couleurs** : `text-body-secondary` et `text-primary-emphasis` sont prévues pour un fond clair. Sur `bg-dark`, elles seraient trop sombres. Posé sur la colonne, `data-bs-theme="dark"` (mode couleur de Bootstrap 5.3) redéfinit les variables CSS de cette zone seulement : `text-body-secondary` devient un gris clair et `text-primary-emphasis` un bleu clair, tous deux au contraste AA.
- **Le piège** : une couleur « vive » sur fond sombre (`text-primary`, `text-danger`) donne souvent un contraste insuffisant pour du petit texte. On vérifie le contraste, et on préfère les variantes `-emphasis` du thème sombre.
- **Réutilisation** : le logo n'est pas recopié, on réutilise le composant `Logo`, non cliquable ici.

**Dans notre appli** (`src/app/Feature-auth/pages/page-auth/page-auth.html`) :

```html
<div slotStart class="my-auto py-5">
  <p class="mb-3 small fw-bold text-uppercase text-primary-emphasis">Mini-CRM</p>
  <h1 class="display-5 fw-bold mb-3 w-75">
    Vos entreprises, contacts et opportunités, au même endroit.
  </h1>
  <p class="mb-0 text-body-secondary">
    Connectez-vous pour retrouver votre portefeuille commercial.
  </p>
</div>
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

**Afficher ou masquer selon un observable : `@if (… | async; as …)`.** Le header lit directement la session du service. `as session` donne un nom à la valeur reçue, réutilisable dans le bloc. Comme un `BehaviorSubject` émet tout de suite sa valeur courante, puis chaque changement, le badge et le bouton apparaissent à la connexion et disparaissent à la déconnexion, sans autre code (`src/app/shared/header/header.html`) :

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
