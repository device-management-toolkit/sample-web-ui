import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { catchError, Observable, tap, map, of } from 'rxjs'
import { environment } from 'src/environments/environment'
import { AuditLogResponse, EventLog, EventLogResponse } from 'src/models/models'

const DEFAULT_TOP = 0
const DEFAULT_SKIP = 120

@Injectable({
  providedIn: 'root'
})
export class DeviceLogService {
  private readonly http = inject(HttpClient)

  downloadAuditLog(deviceId: string): Observable<Blob> {
    return this.http.get(`${environment.mpsServer}/api/v1/amt/log/audit/${deviceId}/download`, {
      responseType: 'blob'
    })
  }

  getAuditLog(deviceId: string, startIndex = 0): Observable<AuditLogResponse> {
    return this.http
      .get<AuditLogResponse>(`${environment.mpsServer}/api/v1/amt/log/audit/${deviceId}?startIndex=${startIndex}`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  downloadEventLog(deviceId: string): Observable<Blob> {
    return this.http.get(`${environment.mpsServer}/api/v1/amt/log/event/${deviceId}/download`, {
      responseType: 'blob'
    })
  }

  getEventLog(
    deviceId: string,
    startIndex: number = DEFAULT_TOP,
    maxReadRecords: number = DEFAULT_SKIP
  ): Observable<EventLogResponse> {
    const url = `${environment.mpsServer}/api/v1/amt/log/event/${deviceId}?$skip=${startIndex}&$top=${maxReadRecords}`

    return this.http.get<EventLogResponse>(url).pipe(
      tap((response) => {
        if (environment.cloud) {
          response = { hasMoreRecords: false, records: response as unknown as EventLog[] } as EventLogResponse
        }
        return of(response)
      }),
      catchError((err) => {
        throw err
      })
    )
  }
}
