import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import Constants from 'src/app/shared/config/Constants'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { WirelessService } from '../wireless.service'

@Component({
  selector: 'app-wireless-detail',
  templateUrl: './wireless-detail.component.html',
  styleUrls: ['./wireless-detail.component.scss']
})
export class WirelessDetailComponent implements OnInit {
  public wirelessForm: FormGroup
  public pageTitle = 'New Wireless Config'
  public pskInputType = 'password'
  public authenticationModes = [{ display: 'WPA PSK', value: Constants.WPAPSK }, { display: 'WPA2 PSK', value: Constants.WPA2PSK }]
  public encryptionModes = [{ display: 'TKIP', value: Constants.TKIP }, { display: 'CCMP', value: Constants.CCMP }]
  isLoading: boolean = true
  isEdit: boolean = false
  errorMessages: any[] = []
  constructor (
    public snackBar: MatSnackBar,
    public fb: FormBuilder,
    private readonly activeRoute: ActivatedRoute,
    public router: Router,
    public wirelessService: WirelessService) {
    this.wirelessForm = fb.group({
      profileName: [null, [Validators.required]],
      authenticationMethod: [this.authenticationModes[0].value, Validators.required],
      encryptionMethod: [this.encryptionModes[0].value, Validators.required],
      ssid: ['', Validators.required],
      pskPassphrase: ['', Validators.required]
    })
  }

  ngOnInit (): void {
    this.activeRoute.params.subscribe((params) => {
      if (params.name != null && params.name !== '') {
        this.wirelessService.getRecord(params.name)
          .pipe(
            finalize(() => {
              this.isLoading = false
            })
          )
          .subscribe((data) => {
            this.isEdit = true
            this.pageTitle = data.profileName
            this.wirelessForm.controls.profileName.disable()
            this.wirelessForm.patchValue(data)
          })
      }
    })
  }

  onSubmit (): void {
    if (this.wirelessForm.valid) {
      this.isLoading = true
      const result: any = Object.assign({}, this.wirelessForm.getRawValue())
      let request
      let reqType: string
      if (this.isEdit) {
        request = this.wirelessService.update(result)
        reqType = 'updated'
      } else {
        request = this.wirelessService.create(result)
        reqType = 'created'
      }
      request.pipe(
        finalize(() => {
          this.isLoading = false
        }))
        .subscribe(data => {
          this.snackBar.open($localize`Profile ${reqType} successfully`, undefined, SnackbarDefaults.defaultSuccess)
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.router.navigate(['/wireless'])
        }, error => {
          this.snackBar.open($localize`Error creating/updating wireless profile`, undefined, SnackbarDefaults.defaultError)
          this.errorMessages = error
        })
    }
  }

  togglePSKPassVisibility (): void {
    this.pskInputType = this.pskInputType === 'password' ? 'text' : 'password'
  }

  async cancel (): Promise<void> {
    await this.router.navigate(['/wireless'])
  }
}
