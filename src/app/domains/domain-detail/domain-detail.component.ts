/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DomainsService } from '../domains.service'

@Component({
  selector: 'app-domain-detail',
  templateUrl: './domain-detail.component.html',
  styleUrls: ['./domain-detail.component.scss']
})
export class DomainDetailComponent implements OnInit {
  public domainForm: FormGroup
  public isLoading = false
  public pageTitle = 'New Domain'
  public isEdit = false
  public certPassInputType = 'password'
  public errorMessages: string[] = []
  constructor (public snackBar: MatSnackBar, public fb: FormBuilder, private readonly activeRoute: ActivatedRoute, public router: Router, public domainsService: DomainsService) {
    this.domainForm = fb.group({
      profileName: [null, Validators.required],
      domainSuffix: [null, Validators.required],
      provisioningCert: [null, Validators.required],
      provisioningCertPassword: [null, Validators.required]
    })
  }

  ngOnInit (): void {
    this.activeRoute.params.subscribe(params => {
      // hmm -- this would actually prevent editing of a domain called new
      if (params.name != null && params.name !== '') {
        this.isLoading = true
        this.domainsService.getRecord(params.name).pipe(
          finalize(() => {
            this.isLoading = false
          })).subscribe(data => {
          this.isEdit = true
          this.domainForm.controls.profileName.disable()
          this.pageTitle = data.profileName
          this.domainForm.patchValue(data)
        },
        err => {
          this.errorMessages = err
        })
      }
    })
  }

  onSubmit (): void {
    const result: any = Object.assign({}, this.domainForm.getRawValue())
    result.provisioningCertStorageFormat = 'string'
    if (this.domainForm.valid) {
      this.isLoading = true
      let request
      let reqType: string
      if (this.isEdit) {
        request = this.domainsService.update(result)
        reqType = 'updated'
      } else {
        request = this.domainsService.create(result)
        reqType = 'created'
      }
      request.pipe(
        finalize(() => {
          this.isLoading = false
        })
      ).subscribe(data => {
        this.snackBar.open($localize`Domain profile ${reqType} successfully`, undefined, SnackbarDefaults.defaultSuccess)
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.router.navigate(['/domains'])
      },
      err => {
        this.snackBar.open($localize`Error creating/updating domain profile`, undefined, SnackbarDefaults.defaultError)
        this.errorMessages = err
      })
    }
  }

  onFileSelected (e: any): void {
    if (typeof (FileReader) !== 'undefined') {
      const reader = new FileReader()

      reader.onload = (e2: any) => {
        const base64 = e2.target.result
        // remove prefix of "data:application/x-pkcs12;base64," returned by "readAsDataURL()"
        const index: number = base64.indexOf('base64,')
        const cert = base64.substring(index + 7, base64.length)
        this.domainForm.patchValue({ provisioningCert: cert })
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  toggleCertPassVisibility (): void {
    this.certPassInputType = this.certPassInputType === 'password' ? 'text' : 'password'
  }

  async cancel (): Promise<void> {
    await this.router.navigate(['/domains'])
  }
}
