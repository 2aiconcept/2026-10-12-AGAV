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

## 3. Les composants

### 3.1 Projeter du contenu avec `ng-content` et `select`

**En bref** : `<ng-content>` affiche, à l'intérieur d'un composant, le HTML que la page a écrit entre ses balises. Avec `select`, on crée plusieurs emplacements (slots).

**Explication** : un composant de mise en page ne connaît pas son contenu : il fournit le cadre, la page fournit ce qu'on met dedans. Plutôt que de passer du texte par des `input()`, on projette directement du HTML. `select="[slotStart]"` ne prend que les éléments qui portent l'attribut `slotStart`. On peut sélectionner aussi par balise ou par classe, mais un attribut dédié est le plus explicite. Le piège : un élément qui ne correspond à aucun `select` (et sans `<ng-content>` par défaut) n'est pas affiché du tout. Autre point : le contenu projeté appartient à la page, pas au composant. Ses liaisons et son style viennent donc de la page.

**Dans notre appli** (`src/app/shared/layout-slice/layout-slice.html`) :

```html
<div class="container-fluid">
  <div class="row min-vh-100">
    <div class="col-md-6 d-flex flex-column bg-dark text-white p-4 p-lg-5">
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

Utilisation dans une page :

```html
<app-layout-slice>
  <div slotStart>…présentation…</div>
  <div slotEnd>…formulaire…</div>
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

**Explication** : pour une barre horizontale, `d-flex align-items-center gap-4` aligne les blocs et les espace sans CSS. `flex-grow-1` sur la zone centrale pousse le reste à droite. Bouton en pilule : `btn btn-outline-light rounded-pill`. Avant d'écrire une règle CSS, on vérifie qu'aucune classe ne le fait. Ici, seul l'avatar en a besoin : un cercle demande une largeur égale à la hauteur, et Bootstrap n'a pas de taille fixe. On commente le « pourquoi » de cette règle. Accessibilité : le bandeau est un `<header>`, repère que les lecteurs d'écran listent. Les initiales de l'avatar sont masquées (`aria-hidden="true"`), car le nom complet est écrit juste à côté, et sinon il serait lu deux fois. On commence en **HTML statique** (nom écrit en dur) pour valider le design. Les données arriveront avec la feature auth.

Découper en composants : le menu était d'abord écrit dans le header. On l'a déplacé dans le composant dumb `Nav` (`shared/nav/`), et le header l'affiche avec `<app-nav>`. Le header n'importe plus `RouterLinkActive`, qui ne sert qu'au menu, mais il importe `Nav`. Les tests suivent le même découpage : `nav.spec.ts` teste les liens et `aria-current`, `header.spec.ts` vérifie seulement que le menu est présent. Une classe posée sur la balise d'un composant (`<app-nav class="flex-grow-1">`) s'applique à son élément hôte : c'est comme ça que le header lui fait prendre la place libre.

**Dans notre appli** (`src/app/shared/header/header.html`) :

```html
<header class="d-flex align-items-center gap-4 bg-dark text-white px-4 py-2">
  <a class="navbar-brand d-flex align-items-center gap-2 me-0" routerLink="/entreprises">…logo…</a>

  <app-nav class="flex-grow-1"></app-nav>

  <div class="d-flex align-items-center gap-2">
    <span
      class="avatar d-flex align-items-center justify-content-center rounded-circle fw-bold bg-primary-subtle text-primary-emphasis"
      aria-hidden="true"
      >CM</span
    >
    <div class="lh-sm">
      <div class="fw-semibold">Chris Martin</div>
    </div>
  </div>

  <button class="btn btn-sm btn-outline-light rounded-pill px-3 fw-semibold" type="button">
    Déconnexion
  </button>
</header>
```

(`src/app/shared/header/header.css`) :

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
