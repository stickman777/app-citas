import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorGridComponent } from './doctor-grid.component';

describe('DoctorGridComponent', () => {
  let component: DoctorGridComponent;
  let fixture: ComponentFixture<DoctorGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DoctorGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
