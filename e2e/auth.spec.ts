/*
 * Ce qu'il faut tester : les parcours d'authentification (feature auth)
 * ---------------------------------------------------------------------
 * Un test e2e (« de bout en bout ») pilote un VRAI navigateur sur la VRAIE application, comme
 * un utilisateur : il clique, tape, et regarde ce qui s'affiche. On y teste des PARCOURS
 * complets, pas le détail de chaque composant (c'est le rôle des tests unitaires, plus rapides).
 *
 * Les parcours à vérifier :
 *  - une page protégée (/entreprises) renvoie vers /connexion quand on n'est pas connecté ;
 *  - se connecter avec le compte de démo mène à la liste des entreprises, avec son nom affiché ;
 *  - de mauvais identifiants affichent un message d'erreur, sans changer de page ;
 *  - envoyer le formulaire vide affiche les erreurs des champs ;
 *  - créer un compte connecte directement l'utilisateur ; un e-mail déjà utilisé est refusé ;
 *  - se déconnecter ramène à la page de connexion, et les pages protégées redeviennent fermées ;
 *  - la page de connexion ne présente pas de problème d'accessibilité détectable (axe).
 *
 * On ne teste PAS ici : le style, ni chaque règle de validation (déjà vus en tests unitaires).
 *
 * Stratégie :
 *  - ces tests commencent SANS session (on teste justement la connexion), donc on annule la
 *    session enregistrée par le setup avec test.use({ storageState: … vide }) ;
 *  - l'API est simulée par FausseApi (page.route) : tests rapides, indépendants, sans toucher
 *    aux données réelles ;
 *  - on trouve les éléments comme un utilisateur : getByRole, getByLabel, getByText.
 *
 * Doc officielle : https://playwright.dev/docs/writing-tests
 */

// test : déclare un test (et fournit l'objet « page ») ; expect : les vérifications.
import { test, expect } from '@playwright/test';
// AxeBuilder : lance l'outil d'audit d'accessibilité axe dans la page.
import AxeBuilder from '@axe-core/playwright';
// La fausse API et le compte de démonstration.
import { COMPTE_DEMO, FausseApi } from './support/fausse-api';

// Tous les tests de ce fichier démarrent déconnectés : état de navigateur vide.
test.use({ storageState: { cookies: [], origins: [] } });

// test.describe regroupe les tests d'un même sujet sous un titre (visible dans le rapport).
test.describe('Authentification', () => {
  // beforeEach : s'exécute avant CHAQUE test. Chaque test a sa propre fausse API, neuve.
  // { page } : Playwright fournit à chaque test un onglet neuf, isolé des autres tests.
  test.beforeEach(async ({ page }) => {
    // On branche la fausse API AVANT d'ouvrir une page.
    await new FausseApi(page).brancher();
  });

  test('renvoie vers la page de connexion quand on ouvre une page protégée sans être connecté', async ({
    page,
  }) => {
    // Act : on tente d'ouvrir directement la liste des entreprises.
    await page.goto('/entreprises');

    // Assert : authGuard nous a redirigés. toHaveURL attend tout seul que l'URL change.
    await expect(page).toHaveURL('/connexion');
    // Le titre de la page de connexion est visible (rôle « heading » = un titre h1…h6).
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('connecte avec le compte de démo et affiche la liste des entreprises', async ({ page }) => {
    // Arrange : on ouvre la page de connexion.
    await page.goto('/connexion');

    // Act : on remplit le formulaire comme un utilisateur, puis on valide.
    await page.getByLabel('Adresse e-mail').fill(COMPTE_DEMO.email);
    // exact: true : seul le champ « Mot de passe » (pas le bouton « Afficher le mot de passe »).
    await page.getByLabel('Mot de passe', { exact: true }).fill(COMPTE_DEMO.password);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Assert : on arrive sur la liste, et le header affiche l'utilisateur connecté.
    await expect(page).toHaveURL('/entreprises');
    await expect(page.getByRole('heading', { name: 'Entreprises' })).toBeVisible();
    await expect(page.getByText('Angular Stagiaire')).toBeVisible();
  });

  test('affiche une erreur avec un mauvais mot de passe, sans changer de page', async ({ page }) => {
    // Arrange : page de connexion.
    await page.goto('/connexion');

    // Act : bon e-mail, mauvais mot de passe.
    await page.getByLabel('Adresse e-mail').fill(COMPTE_DEMO.email);
    await page.getByLabel('Mot de passe', { exact: true }).fill('mauvais-mot-de-passe');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Assert : le message d'erreur (role="alert") s'affiche, et on reste sur /connexion.
    await expect(page.getByRole('alert')).toHaveText('E-mail ou mot de passe incorrect.');
    await expect(page).toHaveURL('/connexion');
  });

  test('affiche les erreurs des champs si on valide le formulaire vide', async ({ page }) => {
    // Arrange : page de connexion.
    await page.goto('/connexion');

    // Act : on valide sans rien remplir.
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Assert : chaque champ affiche son message, et reste sur la page.
    await expect(page.getByText('Saisissez une adresse e-mail valide.')).toBeVisible();
    await expect(page.getByLabel('Adresse e-mail')).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL('/connexion');
  });

  test('crée un compte et connecte directement le nouvel utilisateur', async ({ page }) => {
    // Arrange : page de connexion, puis onglet « Créer un compte ».
    await page.goto('/connexion');
    // Le texte « Créer un compte » existe deux fois (onglet + lien en bas) : on cherche
    // l'onglet DANS le groupe « Type de formulaire » pour viser le bon bouton.
    await page
      .getByRole('group', { name: 'Type de formulaire' })
      .getByRole('button', { name: 'Créer un compte' })
      .click();

    // Act : on remplit les 4 champs de l'inscription puis on valide.
    await page.getByLabel('Prénom').fill('Jeanne');
    // exact: true : « Nom » et non « Prénom » (getByLabel cherche par défaut un texte contenu).
    await page.getByLabel('Nom', { exact: true }).fill('Durand');
    await page.getByLabel('Adresse e-mail').fill('jeanne.durand@example.com');
    await page.getByLabel('Mot de passe', { exact: true }).fill('motdepasse123');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();

    // Assert : l'utilisateur est connecté et arrive sur la liste, avec son nom dans le header.
    await expect(page).toHaveURL('/entreprises');
    await expect(page.getByText('Jeanne Durand')).toBeVisible();
  });

  test('refuse la création de compte avec un e-mail déjà utilisé', async ({ page }) => {
    // Arrange : page de connexion, onglet « Créer un compte ».
    await page.goto('/connexion');
    await page
      .getByRole('group', { name: 'Type de formulaire' })
      .getByRole('button', { name: 'Créer un compte' })
      .click();

    // Act : inscription avec l'e-mail du compte de démo, déjà pris.
    await page.getByLabel('Prénom').fill('Jeanne');
    await page.getByLabel('Nom', { exact: true }).fill('Durand');
    await page.getByLabel('Adresse e-mail').fill(COMPTE_DEMO.email);
    await page.getByLabel('Mot de passe', { exact: true }).fill('motdepasse123');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();

    // Assert : le message de l'API s'affiche et on reste sur la page.
    await expect(page.getByRole('alert')).toHaveText('Email deja utilise');
    await expect(page).toHaveURL('/connexion');
  });

  test('déconnecte et referme les pages protégées', async ({ page }) => {
    // Arrange : on se connecte d'abord (ce fichier démarre déconnecté).
    await page.goto('/connexion');
    await page.getByLabel('Adresse e-mail').fill(COMPTE_DEMO.email);
    await page.getByLabel('Mot de passe', { exact: true }).fill(COMPTE_DEMO.password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL('/entreprises');

    // Act : clic sur « Déconnexion » dans le header.
    await page.getByRole('button', { name: 'Déconnexion' }).click();

    // Assert : retour à la connexion, et /entreprises est de nouveau refusée.
    await expect(page).toHaveURL('/connexion');
    await page.goto('/entreprises');
    await expect(page).toHaveURL('/connexion');
  });

  test("la page de connexion n'a pas de problème d'accessibilité détectable", async ({ page }) => {
    // Arrange : page de connexion affichée.
    await page.goto('/connexion');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Act : axe analyse la page (contrastes, libellés, rôles ARIA, titres…).
    const resultat = await new AxeBuilder({ page }).analyze();

    // Assert : aucune violation. En cas d'échec, le rapport liste chaque problème trouvé.
    expect(resultat.violations).toEqual([]);
  });
});
