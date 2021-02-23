/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { Profile } from 'src/models/models'
import { AuthService } from '../auth.service'

@Injectable({
  providedIn: 'root'
})
export class ProfilesService {
  private readonly url = `${environment.rpsServer}/api/v1/admin/profiles`
  constructor (private readonly authService: AuthService, private readonly http: HttpClient) {

  }

  getData (): Observable<Profile[]> {
    return this.http.get<Profile[]>(this.url, this.authService.getRPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getRecord (name: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.url}/${name}`, this.authService.getRPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  update (profile: Profile): Observable<Profile> {
    return this.http.patch<Profile>(this.url, profile, this.authService.getRPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  create (profile: Profile): Observable<Profile> {
    return this.http.post<Profile>(this.url, profile, this.authService.getRPSOptions())
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
