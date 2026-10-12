import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormContact } from './form-contact';

describe('FormContact', () => {
  let component: FormContact;
  let fixture: ComponentFixture<FormContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormContact],
    }).compileComponents();

    fixture = TestBed.createComponent(FormContact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
