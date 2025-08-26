/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { DataWithCount, PageEventOptions, ProxyConfig } from 'src/models/models'
import { AuthService } from '../auth.service'

@Injectable({
  providedIn: 'root'
})
export class ProxyConfigsService {
  private readonly authService = inject(AuthService)
  private readonly http = inject(HttpClient)
  private readonly url = `${environment.rpsServer}/api/v1/admin/proxyconfigs`

  getData(pageEvent?: PageEventOptions): Observable<DataWithCount<ProxyConfig>> {
    let query = this.url
    query += `?$count=${pageEvent?.count}`

    if (pageEvent?.pageSize) {
      query += `&$top=${pageEvent.pageSize}`
    }

    if (pageEvent?.startsFrom) {
      query += `&$skip=${pageEvent.startsFrom}`
    }

    return this.http.get<DataWithCount<ProxyConfig>>(query).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  getRecord(accessInfo: string): Observable<ProxyConfig> {
    return this.http.get<ProxyConfig>(`${this.url}/${encodeURIComponent(accessInfo)}`).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  create(config: ProxyConfig): Observable<ProxyConfig> {
    return this.http.post<ProxyConfig>(this.url, config).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  update(config: ProxyConfig): Observable<ProxyConfig> {
    return this.http.patch<ProxyConfig>(this.url, config).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  delete(accessInfo: string): Observable<any> {
    return this.http.delete(`${this.url}/${encodeURIComponent(accessInfo)}`).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }
}