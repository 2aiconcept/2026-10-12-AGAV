/*
 * Ce qu'il faut tester : les parcours de la feature entreprises
 * -------------------------------------------------------------
 * On suit ce que fait un commercial, du début à la fin de chaque action :
 *  - voir la liste des entreprises (une ligne par entreprise, le nombre affiché) ;
 *  - voir un message clair si la liste ne peut pas être chargée ;
 *  - ajouter une entreprise : formulaire, retour à la liste, nouvelle ligne visible ;
 *  - être bloqué par la validation si le nom est vide ;
 *  - modifier une entreprise : formulaire prérempli, enregistrement, liste à jour ;
 *  - supprimer une entreprise après confirmation, ou ne rien supprimer si on annule ;
 *  - revenir sur la liste en naviguant montre la liste ACTUELLE de l'API (le store NgRx est
 *    partagé entre les pages : il ne doit pas réafficher une liste périmée) ;
 *  - la page liste ne présente pas de problème d'accessibilité détectable (axe).
 *
 * On ne teste PAS ici : chaque règle de validation ni chaque cas d'erreur du service
 * (tests unitaires), ni le style.
 *
 * Stratégie :
 *  - les tests démarrent CONNECTÉS : la session vient du projet « setup » (auth.setup.ts),
 *    rechargée automatiquement par l'option storageState de playwright.config.ts ;
 *  - chaque test crée sa FausseApi avec ses propres entreprises de départ : aucun test ne
 *    dépend d'un autre, ni des données réelles ;
 *  - après une action, on vérifie l'ÉCRAN (ce que voit l'utilisateur), et parfois aussi
 *    l'état de la fausse API (ce que l'application a vraiment envoyé).
 *
 * Doc officielle : https://playwright.dev/docs/writing-tests
 */

// test, expect : outils de test ; Page : le type de l'onglet piloté.
import { test, expect, Page } from '@playwright/test';
// Audit d'accessibilité.
import AxeBuilder from '@axe-core/playwright';
// Le type d'une entreprise (le même que dans l'application).
import { Entreprise } from '../src/app/Feature-entreprises/models/entreprise';
// La fausse API.
import { FausseApi } from './support/fausse-api';

// Données de départ communes : on les COPIE dans chaque FausseApi, donc aucun test ne les modifie.
const ENTREPRISES_DE_DEPART: Entreprise[] = [
  {
    id: 1,
    nom: 'TechVision',
    secteur: 'IT & Cloud',
    adresse: "12 rue de l'Innovation, 75011 Paris",
    telephone: '01 45 67 89 00',
  },
  { id: 2, nom: 'StratConseil', secteur: 'Conseil', adresse: '8 avenue Foch, 69006 Lyon' },
];

// La ligne du tableau qui contient une entreprise donnée.
// getByRole('row') : les lignes <tr> ; filter({ hasText }) : garde celle qui contient ce texte.
function ligne(page: Page, nom: string) {
  return page.getByRole('row').filter({ hasText: nom });
}

// Le champ « Nom » du formulaire entreprise. Son libellé est « Nom * » (l'astérisque marque un
// champ obligatoire), donc getByLabel('Nom', { exact: true }) ne le trouve pas. On le cherche par
// son NOM ACCESSIBLE (ce qu'annonce un lecteur d'écran) : l'astérisque est en aria-hidden, il
// n'en fait pas partie. getByRole('textbox', { name }) : un champ texte nommé « Nom ».
function champNom(page: Page) {
  return page.getByRole('textbox', { name: 'Nom', exact: true });
}

test.describe('Entreprises', () => {
  // La fausse API du test en cours, accessible dans chaque test.
  let api: FausseApi;

  // Avant chaque test : une fausse API neuve avec les entreprises de départ.
  test.beforeEach(async ({ page }) => {
    api = new FausseApi(page, ENTREPRISES_DE_DEPART);
    await api.brancher();
  });

  test('affiche la liste des entreprises et leur nombre', async ({ page }) => {
    // Act : on ouvre la liste (on est déjà connecté grâce au setup).
    await page.goto('/entreprises');

    // Assert : le titre, une ligne par entreprise avec ses informations, et le compteur.
    await expect(page.getByRole('heading', { name: 'Entreprises' })).toBeVisible();
    await expect(ligne(page, 'TechVision')).toContainText('IT & Cloud');
    await expect(ligne(page, 'StratConseil')).toContainText('Conseil');
    await expect(page.getByText('2 entreprise(s) affichée(s)')).toBeVisible();
  });

  test("affiche un message d'erreur si la liste ne peut pas être chargée", async ({ page }) => {
    // Arrange : la fausse API répondra 500 à la lecture de la liste.
    api.simulerPanneDeLaListe();

    // Act : on ouvre la liste.
    await page.goto('/entreprises');

    // Assert : le message d'erreur est visible (role="alert").
    await expect(page.getByRole('alert')).toContainText('Impossible de charger les entreprises.');
  });

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
    // … et l'API a bien reçu les données saisies.
    expect(api.entreprises.find((entreprise) => entreprise.nom === 'DataCorp')).toMatchObject({
      secteur: 'Data & IA',
      telephone: '05 67 89 01 23',
    });
  });

  test("bloque l'ajout tant que le nom est vide", async ({ page }) => {
    // Arrange : formulaire d'ajout.
    await page.goto('/entreprises/ajouter');

    // Act : on valide sans nom.
    await page.getByRole('button', { name: 'Ajouter' }).click();

    // Assert : le message d'erreur s'affiche, on reste sur la page, et rien n'a été créé.
    await expect(page.getByText('Le nom est obligatoire.')).toBeVisible();
    await expect(champNom(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL('/entreprises/ajouter');
    expect(api.entreprises).toHaveLength(2);
  });

  test('modifie une entreprise depuis la liste', async ({ page }) => {
    // Arrange : liste, puis lien « Modifier » de la ligne TechVision.
    await page.goto('/entreprises');
    await ligne(page, 'TechVision').getByRole('link', { name: /Modifier/ }).click();
    await expect(page).toHaveURL('/entreprises/1/modifier');
    // Le formulaire est prérempli avec les données chargées depuis l'API.
    await expect(champNom(page)).toHaveValue('TechVision');

    // Act : on change le nom et on enregistre.
    await champNom(page).fill('TechVision SAS');
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Assert : retour à la liste, avec le nouveau nom.
    await expect(page).toHaveURL('/entreprises');
    await expect(ligne(page, 'TechVision SAS')).toBeVisible();
  });

  test('supprime une entreprise après confirmation', async ({ page }) => {
    // Arrange : liste affichée.
    await page.goto('/entreprises');
    await expect(ligne(page, 'StratConseil')).toBeVisible();
    // La suppression ouvre une boîte confirm() du navigateur. Par défaut, Playwright la refuse :
    // on lui dit d'accepter la PROCHAINE boîte de dialogue (« OK »).
    page.once('dialog', (dialogue) => dialogue.accept());

    // Act : clic sur « Supprimer » de la ligne StratConseil.
    await ligne(page, 'StratConseil').getByRole('button', { name: /Supprimer/ }).click();

    // Assert : la ligne a disparu (liste relue sur l'API) et le compteur a baissé.
    await expect(ligne(page, 'StratConseil')).toHaveCount(0);
    await expect(page.getByText('1 entreprise(s) affichée(s)')).toBeVisible();
  });

  test('ne supprime rien si on annule la confirmation', async ({ page }) => {
    // Arrange : liste affichée ; cette fois on répond « Annuler » à la boîte de dialogue.
    await page.goto('/entreprises');
    await expect(ligne(page, 'StratConseil')).toBeVisible();
    page.once('dialog', (dialogue) => dialogue.dismiss());

    // Act : clic sur « Supprimer ».
    await ligne(page, 'StratConseil').getByRole('button', { name: /Supprimer/ }).click();

    // Assert : la ligne est toujours là, et l'API n'a rien supprimé.
    await expect(ligne(page, 'StratConseil')).toBeVisible();
    expect(api.entreprises).toHaveLength(2);
  });

  // Ce test vérifie un comportement propre au store NgRx : il est PARTAGÉ par toute l'application
  // (providedIn: 'root') et garde donc la liste entre deux pages. Si la page liste ne la relisait
  // pas à chaque arrivée, on reverrait l'ancienne liste. Seul un vrai parcours de navigation, dans
  // la même session de l'application, peut le prouver : c'est le rôle d'un test e2e.
  test("relit la liste sur l'API à chaque retour sur la page, même si un collègue l'a changée", async ({
    page,
  }) => {
    // Arrange : la liste est affichée une première fois (2 entreprises, déjà gardées par le store).
    await page.goto('/entreprises');
    await expect(page.getByText('2 entreprise(s) affichée(s)')).toBeVisible();
    // Un collègue ajoute une entreprise de son côté : on la met directement dans la fausse API,
    // sans passer par l'écran (comme si elle venait d'un autre navigateur).
    api.entreprises.push({ id: 3, nom: 'ShopNow', secteur: 'E-commerce' });

    // Act : on quitte la liste puis on y revient EN NAVIGUANT dans l'application (clics sur des
    // liens, pas page.goto) : l'application n'est pas rechargée, le store garde son ancienne liste.
    await page.getByRole('link', { name: 'Ajouter une entreprise' }).click();
    await expect(page).toHaveURL('/entreprises/ajouter');
    await page.getByRole('link', { name: 'Retour à la liste des entreprises' }).click();

    // Assert : la liste affichée est celle de l'API, avec l'entreprise du collègue.
    await expect(page).toHaveURL('/entreprises');
    await expect(ligne(page, 'ShopNow')).toBeVisible();
    await expect(page.getByText('3 entreprise(s) affichée(s)')).toBeVisible();
  });

  test("la page liste n'a pas de problème d'accessibilité détectable", async ({ page }) => {
    // Arrange : liste chargée (on attend une ligne pour analyser la page complète).
    await page.goto('/entreprises');
    await expect(ligne(page, 'TechVision')).toBeVisible();

    // Act : audit axe de toute la page.
    const resultat = await new AxeBuilder({ page }).analyze();

    // Assert : aucune violation.
    expect(resultat.violations).toEqual([]);
  });
});
