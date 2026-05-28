/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from '../../environments/environment'
import { AuthService } from '../auth.service'
import { PackageRequest, RpcRelease } from './download-rpc.constants'

@Injectable({
  providedIn: 'root'
})
export class DownloadRpcService {
  private readonly authService = inject(AuthService)
  private readonly http = inject(HttpClient)

  private readonly url = `${environment.rpsServer}/api/package`

  getVersions(): Observable<RpcRelease[]> {
    return this.http.get<RpcRelease[]>(`${this.url}/rpc-versions`).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  buildPackage(request: PackageRequest): Observable<Blob> {
    return this.http.post(this.url, request, { responseType: 'blob' }).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }
}
