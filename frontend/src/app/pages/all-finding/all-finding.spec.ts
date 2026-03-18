import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllFinding } from './all-finding';

describe('AllFinding', () => {
  let component: AllFinding;
  let fixture: ComponentFixture<AllFinding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllFinding]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllFinding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
