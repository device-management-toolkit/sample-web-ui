/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { DataWithCount, IEEE8021xConfig, PageEventOptions } from 'src/models/models'
import { AuthService } from '../auth.service'

@Injectable({
  providedIn: 'root'
})
export class IEEE8021xService {
  private readonly http = inject(HttpClient)
  private readonly authService = inject(AuthService)

  private readonly url = `${environment.rpsServer}/api/v1/admin/ieee8021xconfigs`

  getData(pageEvent?: PageEventOptions): Observable<DataWithCount<IEEE8021xConfig>> {
    let query = this.url
    if (pageEvent) {
      query += `?$top=${pageEvent.pageSize}&$skip=${pageEvent.startsFrom}&$count=true`
    } else {
      query += '?$count=true'
    }
    return this.http.get<DataWithCount<IEEE8021xConfig>>(query).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  getRecord(name: string): Observable<IEEE8021xConfig> {
    return this.http.get<IEEE8021xConfig>(`${this.url}/${encodeURIComponent(name)}`).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  delete(name: string): Observable<any> {
    return this.http.delete(`${this.url}/${encodeURIComponent(name)}`).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  update(config: IEEE8021xConfig): Observable<IEEE8021xConfig> {
    return this.http.patch<IEEE8021xConfig>(this.url, config).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  create(config: IEEE8021xConfig): Observable<IEEE8021xConfig> {
    return this.http.post<IEEE8021xConfig>(this.url, config).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }
}
