// =================================================================================================
// Ce qu'il faut tester : EntreprisesService
// =================================================================================================
// Le service est le seul endroit qui parle à l'API des entreprises. Ce qu'on attend de lui, vu
// de l'extérieur, c'est :
// - qu'il envoie la BONNE requête : la bonne méthode HTTP (GET, POST, PUT, DELETE), à la bonne
//   URL, avec le bon corps (body) pour les écritures ;
// - qu'il rende la réponse de l'API à l'appelant : dans les signals de la ressource pour
//   lister() (value(), hasValue(), error()), ou dans la Promise pour les autres méthodes ;
// - qu'il signale les erreurs : error() rempli pour la ressource, Promise rejetée pour le reste ;
// - que les écritures partent tout de suite (firstValueFrom s'abonne dès l'appel).
//
// Ce qu'on ne teste PAS : la façon dont le service est écrit (qu'il utilise firstValueFrom,
// httpResource, une variable apiUrl…). On ne vérifie que ce qui sort du service : les requêtes
// envoyées et les valeurs rendues.
//
// Stratégie : on utilise le VRAI service, mais avec un FAUX backend. provideHttpClientTesting()
// remplace le réseau par HttpTestingController : aucune requête ne sort de l'ordinateur, chaque
// requête est mise « en attente », le test l'inspecte puis choisit la réponse (flush).
// =================================================================================================

// ApplicationRef : l'application Angular elle-même ; whenStable() attend qu'elle ait fini de
// travailler (signals recalculés, réponses traitées). Utile ici car il n'y a pas de composant
// (donc pas de fixture.whenStable()).
import { ApplicationRef } from '@angular/core';
// TestBed : le « banc d'essai » d'Angular. Il crée un mini-environnement d'injection pour le test.
import { TestBed } from '@angular/core/testing';
// provideHttpClient : fournit HttpClient (comme dans app.config.ts de la vraie application).
import { provideHttpClient } from '@angular/common/http';
// provideHttpClientTesting : remplace le vrai réseau par un faux backend contrôlé par le test.
// HttpTestingController : l'outil qui permet d'inspecter les requêtes et d'y répondre.
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
// L'URL de base de l'API : on la réutilise pour ne pas recopier l'adresse en dur.
import { environment } from '../../../environments/environment';
// Les types des données manipulées : ce que l'API renvoie et ce qu'on lui envoie.
import { Entreprise } from '../models/entreprise';
import { EntrepriseInput } from '../models/entreprise-input';
// La classe testée.
import { EntreprisesService } from './entreprises-service';

// L'URL attendue pour toutes les requêtes du service (constante nommée, pas de chaîne magique).
const URL_ENTREPRISES = `${environment.apiBaseUrl}/entreprises`;
// Une réponse d'erreur serveur, réutilisée dans les tests d'échec.
const ERREUR_SERVEUR = { status: 500, statusText: 'Erreur serveur' };

// describe : regroupe les tests d'un même sujet. Le texte apparaît dans le rapport de tests.
describe('EntreprisesService', () => {
  // Variables remplies dans beforeEach, recréées avant CHAQUE test (aucun état partagé).
  let service: EntreprisesService;
  let httpTesting: HttpTestingController;

  // Jeu de données : une entreprise telle que l'API la renvoie (avec son id).
  const techVision: Entreprise = {
    id: 1,
    nom: 'TechVision',
    secteur: 'IT & Cloud',
    adresse: "12 rue de l'Innovation, 75011 Paris",
    telephone: '01 45 67 89 00',
  };

  // Ce qu'on envoie pour créer une entreprise : pas d'id, c'est l'API qui le génère.
  const nouvelleEntreprise: EntrepriseInput = { nom: 'DataCorp', secteur: 'Data & IA' };

  // beforeEach : exécuté avant chaque test, pour repartir d'un environnement neuf.
  beforeEach(() => {
    // configureTestingModule : déclare ce que l'environnement de test doit fournir.
    TestBed.configureTestingModule({
      // HttpClient + son faux backend. Le service, lui, n'a pas besoin d'être déclaré :
      // @Service() le rend injectable partout, comme dans la vraie application.
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    // TestBed.inject : demande une instance au système d'injection (comme inject() dans le code).
    service = TestBed.inject(EntreprisesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  // afterEach : exécuté après chaque test.
  afterEach(() => {
    // verify() échoue s'il reste une requête à laquelle le test n'a pas répondu :
    // on est sûr qu'aucune requête inattendue n'a été envoyée.
    httpTesting.verify();
  });

  // -----------------------------------------------------------------------------------------------
  // Lecture : lister() renvoie une ressource httpResource
  // -----------------------------------------------------------------------------------------------
  describe('lister (httpResource)', () => {
    // async : le test attend (await) que l'application ait traité la réponse.
    it("charge les entreprises de l'API avec un GET et les expose dans value()", async () => {
      // Arrange : httpResource utilise inject() en interne, il doit donc être créé dans un
      // « contexte d'injection ». Dans un composant, c'est automatique (initialisation d'une
      // propriété) ; dans un test de service, runInInjectionContext fournit ce contexte.
      const entreprises = TestBed.runInInjectionContext(() => service.lister());

      // Act : httpResource n'envoie pas sa requête immédiatement, mais au prochain cycle de
      // détection des changements. TestBed.tick() déclenche ce cycle : la requête part.
      TestBed.tick();
      // expectOne : vérifie qu'UNE requête (et une seule) a été envoyée à cette URL, et la renvoie
      // pour qu'on puisse l'inspecter. Le test échoue s'il y en a zéro ou plusieurs.
      const requete = httpTesting.expectOne(URL_ENTREPRISES);
      // flush : le faux backend « répond » avec ces données (statut 200 par défaut).
      requete.flush([techVision]);
      // On attend que l'application ait rangé la réponse dans les signals de la ressource.
      // Important : avant le flush, whenStable() ne se terminerait jamais, car une requête
      // httpResource en attente compte comme du travail en cours.
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert : la bonne méthode HTTP, et les données exposées par la ressource.
      expect(requete.request.method).toBe('GET');
      expect(entreprises.hasValue()).toBe(true);
      expect(entreprises.value()).toEqual([techVision]);
    });

    it('signale une erreur dans error() si la requête échoue', async () => {
      // Arrange : la ressource est créée dans un contexte d'injection (voir le test précédent).
      const entreprises = TestBed.runInInjectionContext(() => service.lister());
      // TestBed.tick() fait partir la requête GET.
      TestBed.tick();

      // Act : le faux backend répond par une erreur 500. Le 2e argument de flush donne le statut.
      httpTesting.expectOne(URL_ENTREPRISES).flush({ message: 'erreur' }, ERREUR_SERVEUR);
      // On attend que la ressource ait traité l'erreur.
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert : error() contient l'erreur, et la ressource n'a pas de valeur.
      expect(entreprises.error()).toBeDefined();
      expect(entreprises.hasValue()).toBe(false);
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Écritures (et trouver) : des Promise obtenues avec firstValueFrom
  // -----------------------------------------------------------------------------------------------
  describe('trouver, creer, modifier, supprimer (firstValueFrom)', () => {
    // Pas d'async ici : on vérifie seulement que la requête est partie, sans attendre de réponse.
    it("envoie la requête dès l'appel, sans attendre qu'on lise la Promise", () => {
      // Arrange : rien à préparer, le service est prêt.

      // Act : on appelle la méthode, sans « await » et sans lire le résultat.
      // Contrairement à un Observable froid, firstValueFrom s'abonne tout de suite.
      void service.supprimer(1);

      // Assert : la requête est déjà en attente dans le faux backend (expectOne la trouve).
      // On y répond (flush) pour que verify() ne signale pas de requête oubliée.
      httpTesting.expectOne(`${URL_ENTREPRISES}/1`).flush(null);
    });

    it("charge toute la liste avec un GET, sous forme de Promise (méthode utilisée par le store)", async () => {
      // Arrange : rien à préparer.

      // Act : on lance le chargement ; on garde la Promise pour la lire après la réponse.
      const chargement = service.chargerListe();
      // La requête est partie tout de suite (firstValueFrom s'abonne) : on y répond.
      const requete = httpTesting.expectOne(URL_ENTREPRISES);
      requete.flush([techVision]);

      // Assert : la méthode HTTP, et la liste rendue par la Promise.
      expect(requete.request.method).toBe('GET');
      expect(await chargement).toEqual([techVision]);
    });

    it("trouve une entreprise avec un GET et renvoie la réponse de l'API", async () => {
      // Arrange : rien à préparer.

      // Act : on lance la recherche ; on garde la Promise pour la lire après la réponse.
      const recherche = service.trouver(1);
      // La requête est en attente : on la récupère et on y répond.
      const requete = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);
      requete.flush(techVision);

      // Assert : la méthode HTTP, et la valeur rendue par la Promise (await attend sa résolution).
      expect(requete.request.method).toBe('GET');
      expect(await recherche).toEqual(techVision);
    });

    it("crée une entreprise avec un POST et renvoie l'entreprise créée par l'API", async () => {
      // Arrange : la réponse de l'API = l'entreprise envoyée, complétée par l'id généré.
      const entrepriseCreee: Entreprise = { id: 5, ...nouvelleEntreprise };

      // Act : on lance la création, puis le faux backend répond.
      const creation = service.creer(nouvelleEntreprise);
      const requete = httpTesting.expectOne(URL_ENTREPRISES);
      requete.flush(entrepriseCreee);

      // Assert : méthode POST, corps de la requête = les données saisies, valeur renvoyée.
      // request.body : ce que le service a envoyé à l'API.
      expect(requete.request.method).toBe('POST');
      expect(requete.request.body).toEqual(nouvelleEntreprise);
      expect(await creation).toEqual(entrepriseCreee);
    });

    it("modifie une entreprise avec un PUT et renvoie l'entreprise modifiée par l'API", async () => {
      // Arrange : les modifications envoyées, et la réponse de l'API (l'entreprise complète).
      const modifications: EntrepriseInput = { nom: 'TechVision SAS' };
      const entrepriseModifiee: Entreprise = { ...techVision, ...modifications };

      // Act : on lance la modification de l'entreprise 1, puis le faux backend répond.
      const modification = service.modifier(1, modifications);
      const requete = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);
      requete.flush(entrepriseModifiee);

      // Assert : méthode PUT sur /entreprises/1, avec les modifications en corps de requête.
      expect(requete.request.method).toBe('PUT');
      expect(requete.request.body).toEqual(modifications);
      expect(await modification).toEqual(entrepriseModifiee);
    });

    it('supprime une entreprise avec un DELETE', async () => {
      // Arrange : rien à préparer.

      // Act : on lance la suppression ; l'API répond sans contenu (null).
      const suppression = service.supprimer(1);
      const requete = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);
      requete.flush(null);

      // Assert : méthode DELETE, et la Promise se termine sans erreur.
      // « resolves » : on vérifie la valeur d'une Promise réussie (il faut l'attendre avec await).
      expect(requete.request.method).toBe('DELETE');
      await expect(suppression).resolves.toBeNull();
    });

    it("rejette la Promise si l'API renvoie une erreur", async () => {
      // Arrange : rien à préparer.

      // Act : on lance la suppression, et le faux backend répond par une erreur 500.
      const suppression = service.supprimer(1);
      httpTesting.expectOne(`${URL_ENTREPRISES}/1`).flush({ message: 'erreur' }, ERREUR_SERVEUR);

      // Assert : « rejects » vérifie qu'une Promise échoue ; toMatchObject compare seulement
      // les propriétés indiquées (ici le statut HTTP de l'erreur reçue).
      await expect(suppression).rejects.toMatchObject({ status: 500 });
    });
  });
});
