import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutSlice } from './layout-slice';

describe('LayoutSlice', () => {
  let component: LayoutSlice;
  let fixture: ComponentFixture<LayoutSlice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutSlice],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutSlice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
