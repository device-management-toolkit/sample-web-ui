import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from 'src/app/shared/shared.module'
import { DevicesService } from '../devices.service'

import { AuditLogComponent } from './audit-log.component'

describe('AuditLogComponent', () => {
  let component: AuditLogComponent
  let fixture: ComponentFixture<AuditLogComponent>
  let getAuditLogSpy: jasmine.Spy

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getAuditLog'])
    getAuditLogSpy = devicesService.getAuditLog.and.returnValue(of({ totalCnt: 0, records: [] }))

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [AuditLogComponent],
      providers: [{ provide: DevicesService, useValue: devicesService }, {
        provide: ActivatedRoute,
        useValue: {
          params: of({ id: 'guid' })
        }
      }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditLogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getAuditLogSpy.calls.any()).toBe(true, 'getAuditLog called')
  })
})
