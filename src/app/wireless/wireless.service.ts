/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { PageEventOptions } from 'src/models/models'
import { AuthService } from '../auth.service'
import { Config, ConfigsResponse } from './wireless.constants'

@Injectable({
  providedIn: 'root'
})
export class WirelessService {
  private readonly url = `${environment.rpsServer}/api/v1/admin/wirelessconfigs`
  constructor (private readonly http: HttpClient, private readonly authService: AuthService) { }

  getData (pageEvent?: PageEventOptions): Observable<ConfigsResponse> {
    let query = this.url
    if (pageEvent) {
      query += `?$top=${pageEvent.pageSize}&$skip=${pageEvent.startsFrom}&$count=${pageEvent.count}`
    } else {
      query += '?$count=true'
    }
    return this.http.get<ConfigsResponse>(query)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  getRecord (name: string): Observable<Config> {
    return this.http.get<Config>(`${this.url}/${encodeURIComponent(name)}`)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  delete (name: string): Observable<any> {
    return this.http.delete(`${this.url}/${encodeURIComponent(name)}`)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  update (profile: Config): Observable<Config> {
    return this.http.patch<Config>(this.url, profile)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  create (profile: Config): Observable<Config> {
    return this.http.post<Config>(this.url, profile)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }
}
