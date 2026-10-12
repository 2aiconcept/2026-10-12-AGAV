import { ComponentFixture, TestBed } from '@angular/core/testing';
import PageEntreprises from './page-entreprises';

describe('PageEntreprises', () => {
  let component: PageEntreprises;
  let fixture: ComponentFixture<PageEntreprises>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageEntreprises],
    }).compileComponents();

    fixture = TestBed.createComponent(PageEntreprises);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
