/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, Input, OnInit } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { catchError, finalize, throwError } from 'rxjs'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { FormBuilder } from '@angular/forms'
import { HardwareInformation } from 'src/models/models'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MomentModule } from 'ngx-moment'

@Component({
  selector: 'app-hardware-information',
  standalone: true,
  imports: [
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MomentModule
  ],
  templateUrl: './hardware-information.component.html',
  styleUrl: './hardware-information.component.scss'
})
export class HardwareInformationComponent implements OnInit {
  @Input()
  public deviceId = ''

  isLoading = true
  public hwInfo?: HardwareInformation
  public targetOS: any

  constructor(
    public snackBar: MatSnackBar,
    public readonly activatedRoute: ActivatedRoute,
    public readonly router: Router,
    private readonly devicesService: DevicesService,
    public fb: FormBuilder
  ) {
    this.targetOS = this.devicesService.TargetOSMap
  }

  ngOnInit(): void {
    this.devicesService
      .getHardwareInformation(this.deviceId)
      .pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error retrieving HW Info`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe((results) => {
        this.hwInfo = results
      })
  }
}
