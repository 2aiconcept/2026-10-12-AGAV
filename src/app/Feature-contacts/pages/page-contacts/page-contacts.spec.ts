import { ComponentFixture, TestBed } from '@angular/core/testing';
import PageContacts from './page-contacts';

describe('PageContacts', () => {
  let component: PageContacts;
  let fixture: ComponentFixture<PageContacts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageContacts],
    }).compileComponents();

    fixture = TestBed.createComponent(PageContacts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
