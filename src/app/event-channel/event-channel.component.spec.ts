import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { SharedModule } from '../shared/shared.module'
import { EventChannelComponent } from './event-channel.component'
import { MomentModule } from 'ngx-moment'
import { MQTTService } from './event-channel.service'
import { of } from 'rxjs'

describe('EventChannelComponent', () => {
  let component: EventChannelComponent
  let fixture: ComponentFixture<EventChannelComponent>
  const eventChannelStub = {
    mqttConfig: { hostname: 'test', port: '', path: 'test' },
    connect: jasmine.createSpy('connect'),
    subscribeToTopic: jasmine.createSpy('connect'),
    messageSource: of(),
    connectionStatusSubject: of(),
    changeConnection: jasmine.createSpy('changeConnection'),
    destroy: jasmine.createSpy('destroy')
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([]), MomentModule],
      declarations: [EventChannelComponent],
      providers: [{ provide: MQTTService, useValue: eventChannelStub }]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(EventChannelComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should call onSubmit', async () => {
    component.onSubmit()
    component.eventChannelService.changeConnection(component.eventChannelForm.value)
    expect(component.eventChannelService.changeConnection).toHaveBeenCalled()
  })

  it('should test noData', () => {
    component.dataSource.data = [{ message: 'Sent domains', methods: ['getAllDomains'], timestamp: 1634026109505, type: 'success' }]
    expect(component.dataSource.data.length).toBe(1)
  })
})
