/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { AuditLogResponse, Device } from 'src/models/models'
import { AuthService } from '../auth.service'

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  constructor (private readonly authService: AuthService, private readonly http: HttpClient) {

  }

  getAuditLog (deviceId: string, startIndex: number = 0): Observable<AuditLogResponse> {
    const payload = {
      apikey: 'xxxxx',
      method: 'AuditLog',
      payload: {
        guid: deviceId,
        startIndex: startIndex
      }
    }
    return this.http.post<AuditLogResponse>(`${environment.mpsServer}/amt`, payload, this.authService.getMPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  sendPowerAction (deviceId: string, action: number): Observable<any> {
    const payload = {
      apikey: 'xxxxx',
      method: 'PowerAction',
      payload: {
        guid: deviceId,
        action
      }
    }
    return this.http.post<any>(`${environment.mpsServer}/amt`, payload, this.authService.getMPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getData (): Observable<Device[]> {
    const payload = { apikey: 'xxxxx', method: 'AllDevices', payload: {} }
    return this.http.post<Device[]>(`${environment.mpsServer}/admin`, payload, this.authService.getMPSOptions())
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }
}
