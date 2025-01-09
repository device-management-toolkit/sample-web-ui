import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { catchError, Observable } from 'rxjs'
import { environment } from 'src/environments/environment'
import { AuditLogResponse, EventLog } from 'src/models/models'

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

  getEventLog(deviceId: string): Observable<EventLog[]> {
    return this.http.get<EventLog[]>(`${environment.mpsServer}/api/v1/amt/log/event/${deviceId}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }
}
