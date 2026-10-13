import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Logo } from './logo';

describe('Logo', () => {
  let fixture: ComponentFixture<Logo>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Logo],
    }).compileComponents();

    fixture = TestBed.createComponent(Logo);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche le nom de la marque', () => {
    expect(element.textContent).toContain('liane');
  });

  it('masque aux lecteurs d’écran la lettre et le point décoratifs', () => {
    const decoratifs = Array.from(element.querySelectorAll('[aria-hidden="true"]')).map((e) =>
      e.textContent?.trim(),
    );

    expect(decoratifs).toEqual(['l', '.']);
  });
});
