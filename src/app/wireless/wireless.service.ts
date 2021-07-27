import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { WirelessConfig } from 'src/models/models'
import { AuthService } from '../auth.service'

@Injectable({
  providedIn: 'root'
})
export class WirelessService {
  private readonly url = `${environment.rpsServer}/api/v1/admin/wirelessconfigs`
  constructor (private readonly http: HttpClient, private readonly authService: AuthService) { }

  getData (): Observable<WirelessConfig[]> {
    return this.http.get<WirelessConfig[]>(this.url)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  getRecord (name: string): Observable<WirelessConfig> {
    return this.http.get<WirelessConfig>(`${this.url}/${name}`)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  delete (name: string): Observable<any> {
    return this.http.delete(`${this.url}/${name}`)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  update (profile: WirelessConfig): Observable<WirelessConfig> {
    return this.http.patch<WirelessConfig>(this.url, profile)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  create (profile: WirelessConfig): Observable<WirelessConfig> {
    return this.http.post<WirelessConfig>(this.url, profile)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }
}
