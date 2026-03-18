import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AIValidation } from './aivalidation';

describe('AIValidation', () => {
  let component: AIValidation;
  let fixture: ComponentFixture<AIValidation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AIValidation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AIValidation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
