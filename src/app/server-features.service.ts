/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from '../environments/environment'
import { ServerFeatures } from '../models/models'
import { AuthService } from './auth.service'

@Injectable({
  providedIn: 'root'
})
export class ServerFeaturesService {
  private readonly authService = inject(AuthService)
  private readonly http = inject(HttpClient)

  private readonly url = `${environment.rpsServer}/api/v1/server/features`

  getFeatures(): Observable<ServerFeatures> {
    return this.http.get<ServerFeatures>(this.url).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }
}
