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

  it("n'envoie aucune requête tant qu'on ne s'abonne pas", () => {
    service.lister();

    httpTesting.expectNone(URL_ENTREPRISES);
  });

  it('relance une requête à chaque abonnement (observable froid)', () => {
    const entreprises$ = service.lister();

    entreprises$.subscribe();
    entreprises$.subscribe();

    const requetes = httpTesting.match(URL_ENTREPRISES);
    expect(requetes.length).toBe(2);
    requetes.forEach((requete) => requete.flush([]));
  });

  it('liste les entreprises avec un GET', () => {
    let entreprises: Entreprise[] | undefined;
    service.lister().subscribe((reponse) => (entreprises = reponse));

    const requete = httpTesting.expectOne(URL_ENTREPRISES);
    requete.flush([techVision]);

    expect(requete.request.method).toBe('GET');
    expect(entreprises).toEqual([techVision]);
  });

  it('trouve une entreprise par son id', () => {
    let entreprise: Entreprise | undefined;
    service.trouver(1).subscribe((reponse) => (entreprise = reponse));

    const requete = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);
    requete.flush(techVision);

    expect(requete.request.method).toBe('GET');
    expect(entreprise).toEqual(techVision);
  });

  it('crée une entreprise avec un POST', () => {
    service.creer(nouvelleEntreprise).subscribe();

    const requete = httpTesting.expectOne(URL_ENTREPRISES);

    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual(nouvelleEntreprise);
    requete.flush({ id: 5, ...nouvelleEntreprise });
  });

  it('modifie une entreprise avec un PUT sur son id', () => {
    service.modifier(1, { nom: 'TechVision SAS' }).subscribe();

    const requete = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);

    expect(requete.request.method).toBe('PUT');
    expect(requete.request.body).toEqual({ nom: 'TechVision SAS' });
    requete.flush({ ...techVision, nom: 'TechVision SAS' });
  });

  it('supprime une entreprise avec un DELETE sur son id', () => {
    service.supprimer(1).subscribe();

    const requete = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);

    expect(requete.request.method).toBe('DELETE');
    requete.flush(null);
  });
});
