/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { DataWithCount, PageEventOptions } from 'src/models/models'
import { AuthService } from '../auth.service'
import { Profile } from './profiles.constants'

@Injectable({
  providedIn: 'root'
})
export class ProfilesService {
  private readonly authService = inject(AuthService)
  private readonly http = inject(HttpClient)

  private readonly url = `${environment.rpsServer}/api/v1/admin/profiles`

  getData(pageEvent?: PageEventOptions): Observable<DataWithCount<Profile>> {
    let query = this.url
    if (pageEvent) {
      query += `?$top=${pageEvent.pageSize}&$skip=${pageEvent.startsFrom}&$count=${pageEvent.count}`
    } else {
      query += '?$count=true'
    }
    return this.http.get<DataWithCount<Profile>>(query).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  getRecord(name: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.url}/${encodeURIComponent(name)}`).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  update(profile: Profile): Observable<Profile> {
    return this.http.patch<Profile>(this.url, profile).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  create(profile: Profile): Observable<Profile> {
    return this.http.post<Profile>(this.url, profile).pipe(
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

  export(name: string, domainName: string): Observable<any> {
    return this.http
      .get(`${this.url}/export/${encodeURIComponent(name)}?domainName=${encodeURIComponent(domainName)}`)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }
}
