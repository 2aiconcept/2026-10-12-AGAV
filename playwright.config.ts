// Configuration de Playwright : où sont les tests, quels navigateurs, comment lancer l'application.
// Doc officielle : https://playwright.dev/docs/test-configuration

// defineConfig : aide TypeScript à vérifier la configuration ; devices : réglages prêts à
// l'emploi pour chaque navigateur (taille d'écran, user-agent…).
import { defineConfig, devices } from '@playwright/test';
// Fichier où le projet « setup » enregistre la session : les autres tests démarrent connectés.
import { FICHIER_SESSION } from './e2e/support/session';

// Adresse de l'application lancée par « ng serve ».
const URL_APPLICATION = 'http://localhost:4200';

export default defineConfig({
  // Dossier qui contient les tests e2e (séparé des tests unitaires de src/).
  testDir: './e2e',
  // Les fichiers de test se terminent par .spec.ts (le setup par .setup.ts, voir plus bas).
  testMatch: '**/*.spec.ts',
  // Les tests d'un même fichier peuvent tourner en parallèle (ils sont indépendants).
  fullyParallel: true,
  // Sur un serveur d'intégration continue (CI), un test.only oublié fait échouer le lancement.
  forbidOnly: !!process.env['CI'],
  // En CI, on relance 2 fois un test qui échoue (réseau lent…) ; en local, jamais.
  retries: process.env['CI'] ? 2 : 0,
  // Rapport HTML consultable avec « npm run e2e:report ».
  reporter: 'html',

  // Réglages communs à tous les tests.
  use: {
    // page.goto('/connexion') ira sur http://localhost:4200/connexion.
    baseURL: URL_APPLICATION,
    // Enregistre une « trace » (captures, réseau, DOM) quand un test échoue puis est relancé :
    // on la rejoue pas à pas dans le rapport pour comprendre l'échec.
    trace: 'on-first-retry',
    // Les messages de l'application sont en français.
    locale: 'fr-FR',
  },

  // Les « projets » : ici un projet de préparation (connexion) puis un projet par navigateur.
  projects: [
    {
      // Projet « setup » : se connecte une fois et enregistre la session dans FICHIER_SESSION.
      name: 'setup',
      testMatch: '**/*.setup.ts',
    },
    {
      name: 'chromium',
      // Réglages du navigateur Chrome de bureau + session enregistrée par le setup.
      use: { ...devices['Desktop Chrome'], storageState: FICHIER_SESSION },
      // Ce projet attend que « setup » ait réussi avant de démarrer.
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: FICHIER_SESSION },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      // WebKit : le moteur de Safari.
      use: { ...devices['Desktop Safari'], storageState: FICHIER_SESSION },
      dependencies: ['setup'],
    },
  ],

  // Playwright lance lui-même l'application avant les tests (et l'arrête à la fin).
  webServer: {
    // La commande qui démarre l'application.
    command: 'npm start',
    // Playwright attend que cette URL réponde avant de lancer les tests.
    url: URL_APPLICATION,
    // En local, si l'application tourne déjà (npm start dans un autre terminal), on la réutilise.
    reuseExistingServer: !process.env['CI'],
    // La première compilation d'Angular peut être longue : on laisse 2 minutes.
    timeout: 120_000,
  },
});
