/*
 * Préparation : se connecter UNE fois et enregistrer la session
 * --------------------------------------------------------------
 * Presque toutes les pages du mini-CRM demandent d'être connecté (authGuard). Se reconnecter
 * au début de chaque test serait lent et répétitif. Playwright propose mieux :
 *  1. ce fichier « setup » se connecte une seule fois, par le vrai formulaire ;
 *  2. il enregistre l'état du navigateur (cookies et localStorage, où l'application garde
 *     la session) dans un fichier, avec page.context().storageState() ;
 *  3. les projets chromium / firefox / webkit (playwright.config.ts) rechargent ce fichier
 *     grâce à l'option storageState : leurs tests démarrent déjà connectés.
 *
 * Doc officielle : https://playwright.dev/docs/auth
 */

// test (renommé « setup » pour la lisibilité) et expect : les outils de test de Playwright.
import { test as setup, expect } from '@playwright/test';
// Où enregistrer la session (le même chemin que dans la configuration).
import { FICHIER_SESSION } from './support/session';
// La fausse API et le compte de démonstration.
import { COMPTE_DEMO, FausseApi } from './support/fausse-api';

setup('se connecter avec le compte de démonstration', async ({ page }) => {
  // On branche la fausse API AVANT d'ouvrir la page.
  await new FausseApi(page).brancher();

  // On ouvre la page de connexion (baseURL vient de la configuration).
  await page.goto('/connexion');
  // getByLabel : on trouve le champ par son libellé, comme un utilisateur.
  // fill() efface le champ puis tape le texte.
  await page.getByLabel('Adresse e-mail').fill(COMPTE_DEMO.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(COMPTE_DEMO.password);
  // getByRole('button', { name }) : le bouton dont le texte accessible est « Se connecter ».
  await page.getByRole('button', { name: 'Se connecter' }).click();

  // Assertion « web-first » : Playwright réessaie jusqu'à ce que l'URL corresponde (ou expire).
  // Aucune pause fixe : on attend juste ce qu'il faut.
  await expect(page).toHaveURL('/entreprises');

  // On enregistre l'état du navigateur (dont le localStorage avec la session).
  await page.context().storageState({ path: FICHIER_SESSION });
});
