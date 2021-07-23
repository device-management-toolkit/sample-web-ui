/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { AuthService } from 'src/app/auth.service'
import { environment } from 'src/environments/environment'

@Injectable({
  providedIn: 'root'
})

export class VaultService {
  url: string = `${environment.vault}/v1/secret/data/devices`
  constructor (private readonly httpClient: HttpClient, private readonly authService: AuthService) {}

  getPassword (deviceId: string, rootToken: any): Observable<any> {
    const options = {
      headers: {
        'X-Vault-Token': rootToken
      }
    }
    const url: string = `${this.url}/${deviceId}`
    return this.httpClient.get(url, options)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }
}
