import { Component, OnInit } from '@angular/core'
import { MatCheckboxChange } from '@angular/material/checkbox'
import { MatSelectChange } from '@angular/material/select'
import { MatTabChangeEvent } from '@angular/material/tabs'
import { timer } from 'rxjs'
import { ProfilesService } from 'src/app/profiles/profiles.service'
import { environment } from 'src/environments/environment'
import { Profile } from 'src/models/models'

@Component({
  selector: 'app-add-device',
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.scss']
})
export class AddDeviceComponent implements OnInit {
  profiles: Profile[] = []
  activationUrl: string = ''
  rpcLinux: string = 'sudo ./rpc '
  rpcDocker: string = 'sudo docker run --device=/dev/mei0 rpc:latest '
  rpcWindows: string = 'rpc.exe '
  serverUrl: string = `-u wss://${this.formServerUrl()}/activate `
  selectedProfile: string = ''
  verboseString: string = ''
  certCheckString: string = '-n '
  isCopied: boolean = false
  selectedPlatform: string = 'linux'
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor (private readonly profilesService: ProfilesService) {
  }

  ngOnInit (): void {
    this.profilesService.getData().subscribe(data => {
      this.profiles = data
    })
    this.formActivationUrl()
  }

  tabChange (event: MatTabChangeEvent): void {
    this.selectedPlatform = event.tab.textLabel.toLowerCase()
    this.formActivationUrl()
  }

  formActivationUrl (): void {
    switch (this.selectedPlatform) {
      case 'linux':
        this.activationUrl = this.rpcLinux
        break
      case 'windows':
        this.activationUrl = this.rpcWindows
        break
      case 'docker':
        this.activationUrl = this.rpcDocker
        break
    }
    this.activationUrl += `${this.serverUrl}${this.certCheckString}${this.verboseString}${this.selectedProfile}`
  }

  formServerUrl (): string {
    let serverUrl: string = ''
    const url = environment.rpsServer.substring(environment.rpsServer.indexOf('://') + 3)
    if (url.includes(':')) {
      serverUrl += url.substring(0, url.indexOf(':'))
    } else if (url.includes('/')) {
      serverUrl += url.substring(0, url.indexOf('/'))
    }
    return serverUrl
  }

  profileChange (event: MatSelectChange): void {
    this.selectedProfile = `-c '-t activate --profile ${event.value as string}'`
    this.formActivationUrl()
  }

  onCopy (): void {
    this.isCopied = true
    timer(2000).subscribe(() => {
      this.isCopied = false
    })
  }

  isActivationCommandDisabled (): boolean {
    return this.selectedProfile === ''
  }

  updateCertCheck (event: MatCheckboxChange): void {
    this.certCheckString = event.checked ? '-n ' : ''
    this.formActivationUrl()
  }

  updateVerboseCheck (event: MatCheckboxChange): void {
    this.verboseString = event.checked ? '-v ' : ''
    this.formActivationUrl()
  }
}
