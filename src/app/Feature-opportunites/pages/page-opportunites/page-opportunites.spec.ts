import { ComponentFixture, TestBed } from '@angular/core/testing';
import PageOpportunites from './page-opportunites';

describe('PageOpportunites', () => {
  let component: PageOpportunites;
  let fixture: ComponentFixture<PageOpportunites>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageOpportunites],
    }).compileComponents();

    fixture = TestBed.createComponent(PageOpportunites);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
