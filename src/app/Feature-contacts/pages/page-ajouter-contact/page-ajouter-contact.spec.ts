import { ComponentFixture, TestBed } from '@angular/core/testing';
import PageAjouterContact from './page-ajouter-contact';

describe('PageAjouterContact', () => {
  let component: PageAjouterContact;
  let fixture: ComponentFixture<PageAjouterContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageAjouterContact],
    }).compileComponents();

    fixture = TestBed.createComponent(PageAjouterContact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
