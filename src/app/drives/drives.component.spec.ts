import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrivesComponent } from './drives.component';

describe('DrivesComponent', () => {
  let component: DrivesComponent;
  let fixture: ComponentFixture<DrivesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrivesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DrivesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
