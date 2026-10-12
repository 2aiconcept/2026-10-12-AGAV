import { ComponentFixture, TestBed } from '@angular/core/testing';
import PageEditerContact from './page-editer-contact';

describe('PageEditerContact', () => {
  let component: PageEditerContact;
  let fixture: ComponentFixture<PageEditerContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageEditerContact],
    }).compileComponents();

    fixture = TestBed.createComponent(PageEditerContact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
