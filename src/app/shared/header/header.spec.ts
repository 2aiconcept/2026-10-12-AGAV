import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche un en-tête de page', () => {
    expect(element.querySelector('header')).not.toBeNull();
  });

  it('affiche un logo qui mène à la liste des entreprises', () => {
    const logo = element.querySelector('a');

    expect(logo?.getAttribute('href')).toBe('/entreprises');
    expect(logo?.textContent).toContain('liane');
  });

  it('affiche le menu de navigation principale', () => {
    expect(element.querySelector('nav[aria-label="Navigation principale"]')).not.toBeNull();
  });

  it("affiche le nom de l'utilisateur", () => {
    expect(element.textContent).toContain('Chris Martin');
  });

  function boutonDeconnexion(): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Déconnexion',
    );
  }

  it('affiche un bouton de déconnexion', () => {
    expect(boutonDeconnexion()).toBeDefined();
  });

  it('émet deconnexion quand on clique sur le bouton de déconnexion', () => {
    let nombreDeDeconnexions = 0;
    fixture.componentInstance.deconnexion.subscribe(() => nombreDeDeconnexions++);

    boutonDeconnexion()?.click();

    expect(nombreDeDeconnexions).toBe(1);
  });
});
