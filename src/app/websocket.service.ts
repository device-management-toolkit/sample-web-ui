import { Injectable } from '@angular/core'
import { of, Observable } from 'rxjs'
import { delay, retryWhen, switchMap } from 'rxjs/operators'
import { webSocket, WebSocketSubject } from 'rxjs/webSocket'
import { environment } from 'src/environments/environment'

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  connection$: WebSocketSubject<any> | null = null

  RETRY_SECONDS = 10
  connect (): Observable<any> {
    // https becomes wws, http becomes ws
    const apiUrl = environment.mpsServer.replace(/^http/, 'ws') + '/notifications/control.ashx'
    return of(apiUrl).pipe(
      switchMap(wsUrl => {
        if (this.connection$) {
          return this.connection$
        } else {
          console.log('connected')
          this.connection$ = webSocket(wsUrl)
          return this.connection$
        }
      }),
      retryWhen((errors) => errors.pipe(delay(this.RETRY_SECONDS)))
    )
  }

  send (data: any): void {
    if (this.connection$) {
      this.connection$.next(data)
    } else {
      console.error('Did not send data, open a connection first')
    }
  }

  closeConnection (): void {
    if (this.connection$) {
      this.connection$.complete()
      this.connection$ = null
    }
  }

  ngOnDestroy (): void {
    this.closeConnection()
  }
}
