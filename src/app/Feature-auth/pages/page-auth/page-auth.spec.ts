import { ComponentFixture, TestBed } from '@angular/core/testing';
import PageAuth from './page-auth';

describe('PageAuth', () => {
  let fixture: ComponentFixture<PageAuth>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageAuth],
    }).compileComponents();

    fixture = TestBed.createComponent(PageAuth);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche le logo', () => {
    expect(element.querySelector('app-logo')?.textContent).toContain('liane');
  });

  it('affiche le titre principal de la page', () => {
    const titre = element.querySelector('h1');

    expect(titre?.textContent?.trim()).toBe(
      'Vos entreprises, contacts et opportunités, au même endroit.',
    );
  });

  it("affiche l'invitation à se connecter", () => {
    expect(element.textContent).toContain(
      'Connectez-vous pour retrouver votre portefeuille commercial.',
    );
  });
});
