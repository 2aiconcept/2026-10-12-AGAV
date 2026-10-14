import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Entreprise } from '../models/entreprise';
import { EntrepriseInput } from '../models/entreprise-input';
import { EntreprisesService } from './entreprises-service';

const URL_ENTREPRISES = `${environment.apiBaseUrl}/entreprises`;

describe('EntreprisesService', () => {
  let service: EntreprisesService;
  let httpTesting: HttpTestingController;

  const techVision: Entreprise = {
    id: 1,
    nom: 'TechVision',
    secteur: 'IT & Cloud',
    adresse: "12 rue de l'Innovation, 75011 Paris",
    telephone: '01 45 67 89 00',
  };

  const nouvelleEntreprise: EntrepriseInput = { nom: 'DataCorp', secteur: 'Data & IA' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EntreprisesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('lister (httpResource)', () => {
    it("charge les entreprises de l'API avec un GET dès la création de la ressource", async () => {
      // httpResource doit être créé dans un contexte d'injection.
      const entreprises = TestBed.runInInjectionContext(() => service.lister());
      TestBed.tick();

      const requete = httpTesting.expectOne(URL_ENTREPRISES);
      expect(requete.request.method).toBe('GET');
      requete.flush([techVision]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(entreprises.hasValue()).toBe(true);
      expect(entreprises.value()).toEqual([techVision]);
    });

    it('signale une erreur si la requête échoue', async () => {
      const entreprises = TestBed.runInInjectionContext(() => service.lister());
      TestBed.tick();

      httpTesting
        .expectOne(URL_ENTREPRISES)
        .flush({ error: 'erreur' }, { status: 500, statusText: 'Erreur' });
      await TestBed.inject(ApplicationRef).whenStable();

      expect(entreprises.error()).toBeDefined();
      expect(entreprises.hasValue()).toBe(false);
    });
  });

  describe('écritures (firstValueFrom)', () => {
    it("envoie la requête tout de suite : firstValueFrom s'abonne à l'appel", () => {
      service.supprimer(1);

      httpTesting.expectOne(`${URL_ENTREPRISES}/1`).flush(null);
    });

    it("crée une entreprise avec un POST et renvoie l'entreprise créée par l'API", async () => {
      const creation = service.creer(nouvelleEntreprise);

      const requete = httpTesting.expectOne(URL_ENTREPRISES);
      expect(requete.request.method).toBe('POST');
      expect(requete.request.body).toEqual(nouvelleEntreprise);
      requete.flush({ id: 5, ...nouvelleEntreprise });

      expect(await creation).toEqual({ id: 5, ...nouvelleEntreprise });
    });

    it("trouve une entreprise et renvoie la réponse de l'API", async () => {
      const recherche = service.trouver(1);

      const requete = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);
      expect(requete.request.method).toBe('GET');
      requete.flush(techVision);

      expect(await recherche).toEqual(techVision);
    });


    it("modifie une entreprise avec un PUT et renvoie l'entreprise modifiée par l'API", async () => {
      const modification = service.modifier(1, { nom: 'TechVision SAS' });

      const requete = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);
      expect(requete.request.method).toBe('PUT');
      expect(requete.request.body).toEqual({ nom: 'TechVision SAS' });
      requete.flush({ ...techVision, nom: 'TechVision SAS' });

      expect(await modification).toEqual({ ...techVision, nom: 'TechVision SAS' });
    });

    it('supprime une entreprise avec un DELETE', async () => {
      const suppression = service.supprimer(1);

      const requete = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);
      expect(requete.request.method).toBe('DELETE');
      requete.flush(null);

      await expect(suppression).resolves.toBeNull();
    });

    it("rejette la promesse si l'API renvoie une erreur", async () => {
      const suppression = service.supprimer(1);

      httpTesting
        .expectOne(`${URL_ENTREPRISES}/1`)
        .flush({ error: 'erreur' }, { status: 500, statusText: 'Erreur' });

      await expect(suppression).rejects.toMatchObject({ status: 500 });
    });
  });
});
