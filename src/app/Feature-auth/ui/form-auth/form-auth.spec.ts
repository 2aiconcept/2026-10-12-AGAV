import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormAuth } from './form-auth';

describe('FormAuth', () => {
  let component: FormAuth;
  let fixture: ComponentFixture<FormAuth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAuth],
    }).compileComponents();

    fixture = TestBed.createComponent(FormAuth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
