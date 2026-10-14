# Tests e2e avec Playwright

Ce guide explique comment Playwright est installé dans le mini-CRM, comment lancer les tests de bout en bout (e2e), et comment ils sont organisés.

## 1. À quoi servent les tests e2e ?

Les **tests unitaires** (Vitest, `npm test`) vérifient chaque pièce de l'application séparément : un composant, un service, un pipe. Ils sont rapides et précis.

Les **tests e2e** (« end-to-end », de bout en bout) vérifient que les pièces fonctionnent **ensemble**, dans un **vrai navigateur**. Playwright ouvre l'application, clique, tape au clavier et lit l'écran, comme le ferait un utilisateur. On y teste des **parcours complets** : « je me connecte, j'ajoute une entreprise, je la retrouve dans la liste ».

| | Tests unitaires | Tests e2e |
|---|---|---|
| Outil | Vitest + TestBed | Playwright |
| Ce qu'on teste | une pièce isolée | un parcours utilisateur complet |
| Vitesse | très rapides | plus lents (vrai navigateur) |
| Nombre | beaucoup | peu, sur les parcours importants |

Les deux sont complémentaires : beaucoup de tests unitaires, quelques tests e2e sur les parcours qui comptent.

## 2. L'installation (déjà faite dans le projet)

Voici les commandes qui ont été lancées, pour les refaire dans un autre projet.

```bash
# 1. Le lanceur de tests Playwright et l'outil d'audit d'accessibilité axe
npm install --save-dev @playwright/test @axe-core/playwright

# 2. Les navigateurs de test : Chromium, Firefox et WebKit (le moteur de Safari)
npx playwright install
```

- `@playwright/test` : le lanceur de tests (`test`, `expect`, la configuration, les rapports).
- `@axe-core/playwright` : analyse l'accessibilité d'une page (contrastes, libellés, repères…).
- `npx playwright install` télécharge des navigateurs dédiés aux tests (environ 500 Mo, une seule fois par machine). Ils ne remplacent pas vos navigateurs habituels.

> Pour démarrer un projet de zéro, `npm init playwright@latest` pose des questions et crée tout (configuration, exemple de test, navigateurs). Ici, la configuration a été écrite à la main pour l'adapter au projet.

## 3. Les fichiers

```
playwright.config.ts        # configuration : navigateurs, URL, lancement de l'application
e2e/
  auth.setup.ts             # « setup » : se connecte une fois et enregistre la session
  auth.spec.ts              # parcours de connexion, inscription, déconnexion
  entreprises.spec.ts       # parcours liste, ajout, modification, suppression
  support/
    fausse-api.ts           # fausse API (page.route) : données propres à chaque test
    session.ts              # chemin du fichier de session enregistré par le setup
  .auth/                    # session enregistrée (ignorée par git, recréée à chaque lancement)
```

Chaque fichier de test commence par un bloc « Ce qu'il faut tester », et chaque ligne est commentée.

## 4. Lancer les tests

Playwright démarre lui-même l'application (`npm start`) avant les tests. Si elle tourne déjà dans un autre terminal, il la réutilise.

```bash
npm run e2e           # tous les tests, sur les 3 navigateurs, sans fenêtre visible
npm run e2e:chromium  # Chromium seulement : plus rapide pendant qu'on écrit les tests
npm run e2e:ui        # mode UI : liste des tests, pas à pas, relance automatique
npm run e2e:headed    # affiche le navigateur pendant les tests
npm run e2e:report    # ouvre le rapport HTML du dernier lancement
npm run e2e:codegen   # enregistre vos clics sur l'application et génère le code du test
```

Le **mode UI** (`npm run e2e:ui`) est le plus pédagogique : on voit chaque étape du test, l'écran à chaque instant, et on peut relancer un seul test.

## 5. Les choix du projet

- **Une fausse API** (`e2e/support/fausse-api.ts`) : `page.route()` intercepte les requêtes vers l'API et y répond avec des données propres à chaque test. Les tests ne modifient pas les données réelles, partagées par tous les stagiaires, et donnent toujours le même résultat.
- **Une seule connexion** : le projet `setup` se connecte une fois par le formulaire et enregistre la session (`storageState`). Les autres tests démarrent déjà connectés. Le fichier `auth.spec.ts`, qui teste justement la connexion, repart d'une session vide.
- **Des localisateurs accessibles** : `getByRole`, `getByLabel`, `getByText`. On trouve les éléments comme un utilisateur (ou un lecteur d'écran), jamais par une classe CSS. Bonus : si un test ne trouve pas un bouton par son nom, c'est souvent qu'il manque un libellé.
- **Des assertions qui attendent** : `await expect(locator).toBeVisible()`, `toHaveURL`, `toHaveText` réessaient jusqu'à ce que la condition soit vraie. On n'écrit jamais de pause fixe (`waitForTimeout`).
- **Un audit d'accessibilité** sur les pages principales avec `AxeBuilder`. Il a déjà trouvé de vrais problèmes (contrastes, contenu hors repère), corrigés dans l'application.

## 6. Documentation officielle

- [Installation](https://playwright.dev/docs/intro)
- [Écrire des tests](https://playwright.dev/docs/writing-tests)
- [Localisateurs (getByRole, getByLabel…)](https://playwright.dev/docs/locators)
- [Assertions (expect)](https://playwright.dev/docs/test-assertions)
- [Configuration](https://playwright.dev/docs/test-configuration)
- [Authentification (setup et storageState)](https://playwright.dev/docs/auth)
- [Simuler une API (page.route)](https://playwright.dev/docs/mock)
- [Tests d'accessibilité (axe)](https://playwright.dev/docs/accessibility-testing)
- [Mode UI](https://playwright.dev/docs/test-ui-mode)
- [Générateur de tests (codegen)](https://playwright.dev/docs/codegen)
- [Navigateurs](https://playwright.dev/docs/browsers)
