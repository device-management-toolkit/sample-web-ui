/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { DataWithCount, Domain, PageEventOptions } from 'src/models/models'
import { AuthService } from '../auth.service'

@Injectable({
  providedIn: 'root'
})
export class DomainsService {
  private readonly authService = inject(AuthService)
  private readonly http = inject(HttpClient)

  private readonly url = `${environment.rpsServer}/api/v1/admin/domains`

  getData(pageEvent?: PageEventOptions): Observable<DataWithCount<Domain>> {
    let query = this.url
    if (pageEvent) {
      query += `?$top=${pageEvent.pageSize}&$skip=${pageEvent.startsFrom}&$count=${pageEvent.count}`
    } else {
      query += '?$count=true'
    }
    return this.http.get<DataWithCount<Domain>>(query).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  getRecord(name: string): Observable<Domain> {
    return this.http.get<Domain>(`${this.url}/${encodeURIComponent(name)}`).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  update(domain: Domain): Observable<Domain> {
    return this.http.patch<Domain>(this.url, domain).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  create(domain: Domain): Observable<Domain> {
    return this.http.post<Domain>(this.url, domain).pipe(
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
}
