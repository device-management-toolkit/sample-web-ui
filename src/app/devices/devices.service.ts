/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpClient } from '@angular/common/http'
import { EventEmitter, Injectable, inject } from '@angular/core'
import { Observable, Subject } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import {
  AMTFeaturesResponse,
  AuditLogResponse,
  Device,
  DataWithCount,
  DeviceStats,
  EventLog,
  HardwareInformation,
  PageEventOptions,
  PowerState,
  RedirectionToken,
  UserConsentResponse,
  RedirectionStatus,
  AMTFeaturesRequest,
  DiskInformation,
  IPSAlarmClockOccurrenceInput,
  IPSAlarmClockOccurrence
} from 'src/models/models'
import { caseInsensitiveCompare } from '../../utils'

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  private readonly http = inject(HttpClient)

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

  public PowerStates = {
    2: 'On',
    3: 'Sleep',
    4: 'Sleep',
    6: 'Off',
    7: 'Hibernate',
    8: 'Off',
    9: 'Power Cycle',
    13: 'Off'
  }

  public MemoryTypeMap = {
    0: 'Unknown',
    1: 'Other',
    2: 'DRAM',
    3: 'Synchronous DRAM',
    4: 'Cache DRAM',
    5: 'EDO',
    6: 'EDRAM',
    7: 'VRAM',
    8: 'SRAM',
    9: 'RAM',
    10: 'ROM',
    11: 'Flash',
    12: 'EEPROM',
    13: 'FEPROM',
    14: 'EPROM',
    15: 'CDRAM',
    16: '3DRAM',
    17: 'SDRAM',
    18: 'SGRAM',
    19: 'RDRAM',
    20: 'DDR',
    21: 'DDR-2',
    22: 'BRAM',
    23: 'FB-DIMM',
    24: 'DDR3',
    25: 'FBD2',
    26: 'DDR4',
    27: 'LPDDR',
    28: 'LPDDR2',
    29: 'LPDDR3',
    30: 'LPDDR4',
    31: 'Logical non-volatile device',
    32: 'HBM (High Bandwidth Memory)',
    33: 'HBM2 (High Bandwidth Memory Generation 2)',
    34: 'DDR5',
    35: 'LPDDR5',
    36: 'HBM3 (High Bandwidth Memory Generation 3)',
    37: 'DMTF Reserved'
  }

  public device = new Subject<Device>()

  stopwebSocket: EventEmitter<boolean> = new EventEmitter<boolean>(false)
  startwebSocket: EventEmitter<boolean> = new EventEmitter<boolean>(false)
  connectKVMSocket: EventEmitter<boolean> = new EventEmitter<boolean>(false)
  deviceState: EventEmitter<number> = new EventEmitter<number>()

  getGeneralSettings(deviceId: string): Observable<any> {
    return this.http.get<AuditLogResponse>(`${environment.mpsServer}/api/v1/amt/generalSettings/${deviceId}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getAMTVersion(deviceId: string): Observable<any> {
    return this.http.get<AuditLogResponse>(`${environment.mpsServer}/api/v1/amt/version/${deviceId}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getHardwareInformation(guid: string): Observable<HardwareInformation> {
    return this.http.get<HardwareInformation>(`${environment.mpsServer}/api/v1/amt/hardwareInfo/${guid}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getDiskInformation(guid: string): Observable<DiskInformation> {
    return this.http.get<DiskInformation>(`${environment.mpsServer}/api/v1/amt/diskInfo/${guid}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getAMTFeatures(guid: string): Observable<AMTFeaturesResponse> {
    return this.http.get<AMTFeaturesResponse>(`${environment.mpsServer}/api/v1/amt/features/${guid}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getAlarmOccurrences(guid: string): Observable<IPSAlarmClockOccurrence[]> {
    return this.http
      .get<IPSAlarmClockOccurrence[]>(`${environment.mpsServer}/api/v1/amt/alarmOccurrences/${guid}`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  deleteAlarmOccurrence(guid: string, instanceID: string): Observable<any> {
    const payload = {
      Name: instanceID
    }
    return this.http
      .request<any>('DELETE', `${environment.mpsServer}/api/v1/amt/alarmOccurrences/${guid}`, { body: payload })
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  addAlarmOccurrence(guid: string, alarm: IPSAlarmClockOccurrenceInput): Observable<any> {
    return this.http.post<any>(`${environment.mpsServer}/api/v1/amt/alarmOccurrences/${guid}`, alarm).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  sendPowerAction(deviceId: string, action: number, useSOL = false): Observable<any> {
    const payload = {
      method: 'PowerAction',
      action,
      useSOL
    }

    const url: string =
      action < 100
        ? `${environment.mpsServer}/api/v1/amt/power/action/${deviceId}`
        : `${environment.mpsServer}/api/v1/amt/power/bootoptions/${deviceId}`

    return this.http.post<any>(url, payload).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  sendDeactivate(guid: string): Observable<any> {
    if (environment.cloud) {
      return this.http.delete<any>(`${environment.mpsServer}/api/v1/amt/deactivate/${guid}`).pipe(
        catchError((err) => {
          throw err
        })
      )
    } else {
      const url = `${environment.mpsServer}/api/v1/devices/${guid}`
      return this.http.delete<never>(url).pipe(
        catchError((err) => {
          throw err
        })
      )
    }
  }

  getTags(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.mpsServer}/api/v1/devices/tags`).pipe(
      map((tags) => tags.sort(caseInsensitiveCompare)),
      catchError((err) => {
        throw err
      })
    )
  }

  addDevice(device: Device): Observable<Device> {
    return this.http.post<Device>(`${environment.mpsServer}/api/v1/devices`, device).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  editDevice(device: Device): Observable<Device> {
    return this.http.patch<Device>(`${environment.mpsServer}/api/v1/devices`, device).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getDevice(guid: string): Observable<Device> {
    const query = `${environment.mpsServer}/api/v1/devices/${guid}`
    return this.http.get<Device>(query).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getDevices(pageEvent: PageEventOptions): Observable<DataWithCount<Device>> {
    let query = `${environment.mpsServer}/api/v1/devices`
    if (pageEvent?.tags && pageEvent.tags.length > 0) {
      query += `?tags=${pageEvent.tags.join(',')}&$top=${pageEvent.pageSize}&$skip=${pageEvent.startsFrom}&$count=${pageEvent.count}`
    } else {
      query += `?$top=${pageEvent.pageSize}&$skip=${pageEvent.startsFrom}&$count=${pageEvent.count}`
    }
    return this.http.get<DataWithCount<Device>>(query).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  updateDevice(device: Device): Observable<Device> {
    const url = `${environment.mpsServer}/api/v1/devices`
    return this.http.patch<Device>(url, device).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  setAmtFeatures(
    deviceId: string,
    payload: AMTFeaturesRequest = {
      userConsent: 'none',
      enableKVM: true,
      enableSOL: true,
      enableIDER: true
    }
  ): Observable<AMTFeaturesResponse> {
    return this.http
      .post<AMTFeaturesResponse>(`${environment.mpsServer}/api/v1/amt/features/${deviceId}`, payload)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getPowerState(deviceId: string): Observable<PowerState> {
    return this.http.get<PowerState>(`${environment.mpsServer}/api/v1/amt/power/state/${deviceId}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getStats(): Observable<DeviceStats> {
    return this.http.get<DeviceStats>(`${environment.mpsServer}/api/v1/devices/stats`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  reqUserConsentCode(deviceId: string): Observable<UserConsentResponse> {
    return this.http.get<UserConsentResponse>(`${environment.mpsServer}/api/v1/amt/userConsentCode/${deviceId}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  cancelUserConsentCode(deviceId: string): Observable<UserConsentResponse> {
    return this.http
      .get<UserConsentResponse>(`${environment.mpsServer}/api/v1/amt/userConsentCode/cancel/${deviceId}`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  sendUserConsentCode(deviceId: string, userConsentCode: number): Observable<UserConsentResponse> {
    const payload = { consentCode: userConsentCode }
    return this.http
      .post<UserConsentResponse>(`${environment.mpsServer}/api/v1/amt/userConsentCode/${deviceId}`, payload)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getRedirectionExpirationToken(guid: string): Observable<RedirectionToken> {
    const query = `${environment.mpsServer}/api/v1/authorize/redirection/${guid}`
    return this.http.get<RedirectionToken>(query).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getRedirectionStatus(guid: string): Observable<RedirectionStatus> {
    const query = `${environment.mpsServer}/api/v1/devices/redirectstatus/${guid}`
    return this.http.get<RedirectionStatus>(query).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getWsmanOperations(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.mpsServer}/api/v1/amt/explorer`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  executeExplorerCall(guid: string, call: string): Observable<any> {
    const query = `${environment.mpsServer}/api/v1/amt/explorer/${guid}/${call}`
    return this.http.get<any>(query).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getCertificates(guid: string): Observable<any> {
    return this.http.get<any>(`${environment.mpsServer}/api/v1/amt/certificates/${guid}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getNetworkSettings(guid: string): Observable<any> {
    return this.http.get<any>(`${environment.mpsServer}/api/v1/amt/networkSettings/${guid}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }
  getTLSSettings(guid: string): Observable<any> {
    return this.http.get<any>(`${environment.mpsServer}/api/v1/amt/tls/${guid}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }
  getDeviceCertificate(guid: string): Observable<any> {
    return this.http.get<any>(`${environment.mpsServer}/api/v1/devices/cert/${guid}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }
  pinDeviceCertificate(guid: string, fingerprint: string): Observable<any> {
    return this.http
      .post<any>(`${environment.mpsServer}/api/v1/devices/cert/${guid}`, { sha256Fingerprint: fingerprint })
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }
  deleteDeviceCertificate(guid: string): Observable<any> {
    return this.http.delete<any>(`${environment.mpsServer}/api/v1/devices/cert/${guid}`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }
}
