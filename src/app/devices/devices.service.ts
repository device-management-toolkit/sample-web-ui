/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { HttpClient } from '@angular/common/http'
import { EventEmitter, Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { AmtFeaturesResponse, AuditLogResponse, Device, DeviceStats, HardwareInformation, PowerState } from 'src/models/models'
import { AuthService } from '../auth.service'

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  public TargetOSMap = {
    0: 'Unknown',
    1: 'Other',
    2: 'MACOS',
    3: 'ATTUNIX',
    4: 'DGUX',
    5: 'DECNT',
    6: 'Tru64 UNIX',
    7: 'OpenVMS',
    8: 'HPUX',
    9: 'AIX',
    10: 'MVS',
    11: 'OS400',
    12: 'OS/2',
    13: 'JavaVM',
    14: 'MSDOS',
    15: 'WIN3x',
    16: 'WIN95',
    17: 'WIN98',
    18: 'WINNT',
    19: 'WINCE',
    20: 'NCR3000',
    21: 'NetWare',
    22: 'OSF',
    23: 'DC/OS',
    24: 'Reliant UNIX',
    25: 'SCO UnixWare',
    26: 'SCO OpenServer',
    27: 'Sequent',
    28: 'IRIX',
    29: 'Solaris',
    30: 'SunOS',
    31: 'U6000',
    32: 'ASERIES',
    33: 'HP NonStop OS',
    34: 'HP NonStop OSS',
    35: 'BS2000',
    36: 'LINUX',
    37: 'Lynx',
    38: 'XENIX',
    39: 'VM',
    40: 'Interactive UNIX',
    41: 'BSDUNIX',
    42: 'FreeBSD',
    43: 'NetBSD',
    44: 'GNU Hurd',
    45: 'OS9',
    46: 'MACH Kernel',
    47: 'Inferno',
    48: 'QNX',
    49: 'EPOC',
    50: 'IxWorks',
    51: 'VxWorks',
    52: 'MiNT',
    53: 'BeOS',
    54: 'HP MPE',
    55: 'NextStep',
    56: 'PalmPilot',
    57: 'Rhapsody',
    58: 'Windows 2000',
    59: 'Dedicated',
    60: 'OS/390',
    61: 'VSE',
    62: 'TPF',
    63: 'Windows (R) Me',
    64: 'Caldera Open UNIX',
    65: 'OpenBSD',
    66: 'Not Applicable',
    67: 'Windows XP',
    68: 'z/OS',
    69: 'Microsoft Windows Server 2003',
    70: 'Microsoft Windows Server 2003 64-Bit',
    71: 'Windows XP 64-Bit',
    72: 'Windows XP Embedded',
    73: 'Windows Vista',
    74: 'Windows Vista 64-Bit',
    75: 'Windows Embedded for Point of Service',
    76: 'Microsoft Windows Server 2008',
    77: 'Microsoft Windows Server 2008 64-Bit',
    78: 'FreeBSD 64-Bit',
    79: 'RedHat Enterprise Linux',
    80: 'RedHat Enterprise Linux 64-Bit',
    81: 'Solaris 64-Bit',
    82: 'SUSE',
    83: 'SUSE 64-Bit',
    84: 'SLES',
    85: 'SLES 64-Bit',
    86: 'Novell OES',
    87: 'Novell Linux Desktop',
    88: 'Sun Java Desktop System',
    89: 'Mandriva',
    90: 'Mandriva 64-Bit',
    91: 'TurboLinux',
    92: 'TurboLinux 64-Bit',
    93: 'Ubuntu',
    94: 'Ubuntu 64-Bit',
    95: 'Debian',
    96: 'Debian 64-Bit',
    97: 'Linux 2.4.x',
    98: 'Linux 2.4.x 64-Bit',
    99: 'Linux 2.6.x',
    100: 'Linux 2.6.x 64-Bit',
    101: 'Linux 64-Bit',
    102: 'Other 64-Bit',
    103: 'Microsoft Windows Server 2008 R2',
    104: 'VMware ESXi',
    105: 'Microsoft Windows 7',
    106: 'CentOS 32-bit',
    107: 'CentOS 64-bit',
    108: 'Oracle Enterprise Linux 32-bit',
    109: 'Oracle Enterprise Linux 64-bit',
    110: 'eComStation 32-bitx',
    111: 'Microsoft Windows Server 2011',
    112: 'Microsoft Windows Server 2011 64-Bit',
    113: 'Microsoft Windows Server 8'
  }

  stopwebSocket: EventEmitter<boolean> = new EventEmitter<boolean>(false)
  startwebSocket: EventEmitter<boolean> = new EventEmitter<boolean>(false)
  connectKVMSocket: EventEmitter<boolean> = new EventEmitter<boolean>(false)

  constructor (private readonly authService: AuthService, private readonly http: HttpClient) {

  }

  getAuditLog (deviceId: string, startIndex: number = 0): Observable<AuditLogResponse> {
    return this.http.get<AuditLogResponse>(`${environment.mpsServer}/api/v1/amt/log/audit/${deviceId}?startIndex=${startIndex}`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getHardwareInformation (guid: string): Observable<HardwareInformation> {
    return this.http.get<HardwareInformation>(`${environment.mpsServer}/api/v1/amt/hardwareInfo/${guid}`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getAMTFeatures (guid: string): Observable<AmtFeaturesResponse> {
    return this.http.get<AmtFeaturesResponse>(`${environment.mpsServer}/api/v1/amt/features/${guid}`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  sendPowerAction (deviceId: string, action: number, useSOL: boolean = false): Observable<any> {
    const payload = {
      method: 'PowerAction',
      action,
      useSOL
    }

    const url: string = action < 100
      ? `${environment.mpsServer}/api/v1/amt/power/action/${deviceId}`
      : `${environment.mpsServer}/api/v1/amt/power/bootoptions/${deviceId}`

    return this.http.post<any>(url, payload)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getData (): Observable<Device[]> {
    const payload = { method: 'AllDevices', payload: {} }
    return this.http.post<Device[]>(`${environment.mpsServer}/api/v1/devices`, payload)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getTags (): Observable<string[]> {
    return this.http.get<string[]>(`${environment.mpsServer}/api/v1/devices/tags`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getDevice (guid: string): Observable<Device> {
    const query = `${environment.mpsServer}/api/v1/devices/${guid}`
    return this.http.get<Device>(query)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getDevices (tags: string[] = []): Observable<Device[]> {
    let query = `${environment.mpsServer}/api/v1/devices`
    if (tags.length > 0) {
      query += `?tags=${tags.join(',')}`
    }
    return this.http.get<Device[]>(query)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  setAmtFeatures (deviceId: string): Observable<AmtFeaturesResponse> {
    const payload = { userConsent: 'none', enableKVM: true, enableSOL: true, enableIDER: true }
    return this.http.post<AmtFeaturesResponse>(`${environment.mpsServer}/api/v1/amt/features/${deviceId}`, payload)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getPowerState (deviceId: string): Observable<PowerState> {
    return this.http.get<PowerState>(`${environment.mpsServer}/api/v1/amt/power/state/${deviceId}`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getStats (): Observable<DeviceStats> {
    return this.http.get<DeviceStats>(`${environment.mpsServer}/api/v1/devices/stats`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }
}
