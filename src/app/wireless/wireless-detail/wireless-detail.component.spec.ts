import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from 'src/app/shared/shared.module'
import { WirelessService } from '../wireless.service'

import { WirelessDetailComponent } from './wireless-detail.component'

describe('WirelessDetailComponent', () => {
  let component: WirelessDetailComponent
  let fixture: ComponentFixture<WirelessDetailComponent>
  let wirelessSpy: jasmine.Spy
  let wirelessCreateSpy: jasmine.Spy
  let wirelessUpdateSpy: jasmine.Spy

  beforeEach(async () => {
    const wirelessService = jasmine.createSpyObj('WirelessService', ['getRecord', 'update', 'create'])
    wirelessSpy = wirelessService.getRecord.and.returnValue(of({}))
    wirelessCreateSpy = wirelessService.create.and.returnValue(of({}))
    wirelessUpdateSpy = wirelessService.update.and.returnValue(of({}))
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [WirelessDetailComponent],
      providers: [{ provide: WirelessService, useValue: wirelessService }, {
        provide: ActivatedRoute,
        useValue: {
          params: of({ name: 'profile' })
        }
      }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(WirelessDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(wirelessSpy).toHaveBeenCalled()
  })

  it('should cancel', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.cancel()
    expect(routerSpy).toHaveBeenCalledWith(['/wireless'])
  })
  it('should submit when valid (update)', () => {
    const routerSpy = spyOn(component.router, 'navigate')

    component.wirelessForm.patchValue({
      profileName: 'profile1',
      authenticationMethod: 4,
      encryptionMethod: 3,
      ssid: 'ssid1234',
      pskPassphrase: 'passphrase1'
    })
    component.onSubmit()

    expect(wirelessUpdateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should not submit form when invalid', () => {
    const routerSpy = spyOn(component.router, 'navigate')

    component.wirelessForm.patchValue({
      profileName: 'profile1',
      authenticationMethod: 4,
      encryptionMethod: 3,
      ssid: 'ssid1234'
    })
    component.onSubmit()

    expect(wirelessUpdateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  it('should submit when valid (create)', () => {
    const routerSpy = spyOn(component.router, 'navigate')

    component.isEdit = false
    component.wirelessForm.patchValue({
      profileName: 'profile1',
      authenticationMethod: 4,
      encryptionMethod: 3,
      ssid: 'ssid1234',
      pskPassphrase: 'passphrase1'
    })
    component.onSubmit()

    expect(wirelessCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should turn psk pass visibility on when it is off', () => {
    component.pskInputType = 'password'
    component.togglePSKPassVisibility()

    expect(component.pskInputType).toEqual('text')
  })

  it('should turn psk pass visibility off when it is on', () => {
    component.pskInputType = 'text'
    component.togglePSKPassVisibility()

    expect(component.pskInputType).toEqual('password')
  })
})
