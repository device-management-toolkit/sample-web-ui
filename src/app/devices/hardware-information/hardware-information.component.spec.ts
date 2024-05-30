import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HardwareInformationComponent } from './hardware-information.component';

describe('HardwareInformationComponent', () => {
  let component: HardwareInformationComponent;
  let fixture: ComponentFixture<HardwareInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HardwareInformationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HardwareInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
