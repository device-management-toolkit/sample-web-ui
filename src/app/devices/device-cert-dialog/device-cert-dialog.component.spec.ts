import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceCertDialogComponent } from './device-cert-dialog.component';

describe('DeviceCertDialogComponent', () => {
  let component: DeviceCertDialogComponent;
  let fixture: ComponentFixture<DeviceCertDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceCertDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeviceCertDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
