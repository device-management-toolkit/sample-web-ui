/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { CIRAConfig } from 'src/models/models'
import { AuthService } from '../auth.service'

@Injectable({
  providedIn: 'root'
})
export class ConfigsService {
  private readonly url = `${environment.rpsServer}/api/v1/admin/ciraconfigs`

  constructor (private readonly authService: AuthService, private readonly http: HttpClient) {

  }

  getData (): Observable<CIRAConfig[]> {
    return this.http.get<CIRAConfig[]>(this.url, this.authService.getRPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getRecord (name: string): Observable<CIRAConfig> {
    return this.http.get<CIRAConfig>(`${this.url}/${name}`, this.authService.getRPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  update (ciraConfig: CIRAConfig): Observable<CIRAConfig> {
    return this.http.patch<CIRAConfig>(this.url, ciraConfig, this.authService.getRPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  create (ciraConfig: CIRAConfig): Observable<CIRAConfig> {
    return this.http.post<CIRAConfig>(this.url, ciraConfig, this.authService.getRPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  loadMPSRootCert (): Observable<string> {
    const options: object = this.authService.getMPSOptions();
    (options as any).responseType = 'text'
    return this.http.post<string>(`${environment.mpsServer}/admin`, { apikey: 'xxxxx', method: 'MPSRootCertificate', payload: {} }, options)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  delete (name: string): Observable<any> {
    return this.http.delete(`${this.url}/${name}`, this.authService.getRPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }
}
