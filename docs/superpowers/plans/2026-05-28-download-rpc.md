# Download RPC (UI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an enterprise-only "Download RPC" page that lets a user pick an rpc-go version, target OS/arch, auth method, and command (activate/deactivate), then downloads a Console-built zip (rpc binary + config.yaml) via a single `POST /api/package` call.

**Architecture:** A standalone Angular feature (`src/app/download-rpc/`) with a reactive form and a thin HTTP service. All packing/GitHub/token work is done server-side by Console; the UI only collects inputs, posts one JSON request, and saves the returned blob. The feature is gated on `environment.cloud === false` (Console-only). Profile/Domain dropdowns reuse the existing `ProfilesService`/`DomainsService`.

**Tech Stack:** Angular 21 standalone components, reactive forms, Angular Material, RxJS, ngx-translate, Karma + Jasmine (`provideHttpClient` + `provideHttpClientTesting`).

**Scope note:** This plan covers the UI repo only. The Console endpoints (`GET /api/package/rpc-versions`, `POST /api/package`) are a separate plan in the `console` repo; this plan treats their contract (see the design doc) as a dependency. Until Console implements them, the UI is verified via unit tests with mocked HTTP.

**Conventions for every new file:** SPDX header (copy the exact block below), no semicolons, single quotes, `@if`/`@for` control flow, `inject()` DI.

```ts
/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
```

---

## File Structure

- Create: `src/app/download-rpc/download-rpc.constants.ts` — request/response interfaces, command/auth enums, OS detection helper.
- Create: `src/app/download-rpc/download-rpc.service.ts` (+ `.spec.ts`) — `getVersions()`, `buildPackage()`.
- Create: `src/app/download-rpc/download-rpc.component.ts` (+ `.html`, `.scss`, `.spec.ts`) — the form page.
- Modify: `src/app/routes.ts` — register `download-rpc` route.
- Modify: `src/app/core/navbar/navbar.component.html` — add enterprise-only nav item.
- Modify: `src/assets/i18n/en.json` — add `downloadRpc.*` strings.

---

### Task 1: Constants and model interfaces

**Files:**
- Create: `src/app/download-rpc/download-rpc.constants.ts`

- [ ] **Step 1: Write the constants/types file**

```ts
/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { FormOption } from '../../models/models'

export type RpcCommand = 'activate' | 'deactivate'
export type AuthMode = 'token' | 'userpass'

export const RpcCommands: FormOption<RpcCommand>[] = [
  { value: 'activate', label: 'downloadRpc.command.activate.value' },
  { value: 'deactivate', label: 'downloadRpc.command.deactivate.value' }
]

export const AuthModes: FormOption<AuthMode>[] = [
  { value: 'token', label: 'downloadRpc.auth.token.value' },
  { value: 'userpass', label: 'downloadRpc.auth.userpass.value' }
]

// One downloadable build for a release, as returned by Console.
export interface RpcAsset {
  os: string // e.g. 'linux' | 'windows' | 'darwin'
  arch: string // e.g. 'x86_64' | 'arm64'
}

// A single rpc-go release (v3+, betas included) returned by Console.
export interface RpcRelease {
  version: string
  assets: RpcAsset[]
}

export interface PackageAuth {
  mode: AuthMode
  username?: string
  password?: string
}

// Body posted to POST /api/package.
export interface PackageRequest {
  command: RpcCommand
  version: string
  os: string
  arch: string
  auth: PackageAuth
  profile?: string // activate only
  domain?: string // activate + ACM only
}

// Best-effort OS guess for pre-selecting the asset dropdown. Returns one of
// the asset os tokens Console uses ('windows' | 'darwin' | 'linux').
export function detectOS(): string {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const platform = (nav.userAgentData?.platform ?? navigator.platform ?? '').toLowerCase()
  if (platform.includes('win')) {
    return 'windows'
  }
  if (platform.includes('mac') || platform.includes('darwin')) {
    return 'darwin'
  }
  return 'linux'
}
```

- [ ] **Step 2: Verify it compiles via lint**

Run: `npm run lint`
Expected: PASS (no new errors in `download-rpc.constants.ts`). `FormOption<T>` already exists in `src/models/models.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/download-rpc/download-rpc.constants.ts
git commit -m "feat(devices): add download-rpc constants and types"
```

---

### Task 2: DownloadRpcService

**Files:**
- Create: `src/app/download-rpc/download-rpc.service.ts`
- Test: `src/app/download-rpc/download-rpc.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule } from '@ngx-translate/core'
import { DownloadRpcService } from './download-rpc.service'
import { AuthService } from '../auth.service'
import { environment } from '../../environments/environment'
import { PackageRequest, RpcRelease } from './download-rpc.constants'

describe('DownloadRpcService', () => {
  let service: DownloadRpcService
  let httpMock: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>

  const mockEnvironment = { rpsServer: 'https://test-server' }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['onError'])
    environment.rpsServer = mockEnvironment.rpsServer
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        DownloadRpcService,
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    service = TestBed.inject(DownloadRpcService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('getVersions should GET the rpc-versions endpoint', () => {
    const mockReleases: RpcRelease[] = [
      { version: 'v3.0.1', assets: [{ os: 'linux', arch: 'x86_64' }] }
    ]
    service.getVersions().subscribe((res) => {
      expect(res).toEqual(mockReleases)
    })
    const req = httpMock.expectOne(`${mockEnvironment.rpsServer}/api/package/rpc-versions`)
    expect(req.request.method).toBe('GET')
    req.flush(mockReleases)
  })

  it('buildPackage should POST the request and return a blob', () => {
    const body: PackageRequest = {
      command: 'activate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      auth: { mode: 'token' },
      profile: 'p1'
    }
    const blob = new Blob(['zip'], { type: 'application/zip' })
    service.buildPackage(body).subscribe((res) => {
      expect(res).toEqual(blob)
    })
    const req = httpMock.expectOne(`${mockEnvironment.rpsServer}/api/package`)
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(body)
    expect(req.request.responseType).toBe('blob')
    req.flush(blob)
  })

  it('getVersions should route errors through AuthService.onError', () => {
    authServiceSpy.onError.and.returnValue(['boom'])
    service.getVersions().subscribe({
      error: (err) => {
        expect(err).toEqual(['boom'])
      }
    })
    const req = httpMock.expectOne(`${mockEnvironment.rpsServer}/api/package/rpc-versions`)
    req.flush('error', { status: 500, statusText: 'Server Error' })
    expect(authServiceSpy.onError).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --include='**/download-rpc.service.spec.ts' --watch=false`
Expected: FAIL — cannot find module `./download-rpc.service`.

- [ ] **Step 3: Write the service**

```ts
/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from '../../environments/environment'
import { AuthService } from '../auth.service'
import { PackageRequest, RpcRelease } from './download-rpc.constants'

@Injectable({
  providedIn: 'root'
})
export class DownloadRpcService {
  private readonly authService = inject(AuthService)
  private readonly http = inject(HttpClient)

  private readonly url = `${environment.rpsServer}/api/package`

  getVersions(): Observable<RpcRelease[]> {
    return this.http.get<RpcRelease[]>(`${this.url}/rpc-versions`).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }

  buildPackage(request: PackageRequest): Observable<Blob> {
    return this.http.post(this.url, request, { responseType: 'blob' }).pipe(
      catchError((err) => {
        const errorMessages = this.authService.onError(err)
        return throwError(errorMessages)
      })
    )
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --include='**/download-rpc.service.spec.ts' --watch=false`
Expected: PASS (4 specs).

- [ ] **Step 5: Commit**

```bash
git add src/app/download-rpc/download-rpc.service.ts src/app/download-rpc/download-rpc.service.spec.ts
git commit -m "feat(devices): add download-rpc service"
```

---

### Task 3: DownloadRpcComponent (class + logic)

**Files:**
- Create: `src/app/download-rpc/download-rpc.component.ts`
- Create: `src/app/download-rpc/download-rpc.component.html` (minimal stub in this task; full template in Task 4)
- Create: `src/app/download-rpc/download-rpc.component.scss` (empty file)
- Test: `src/app/download-rpc/download-rpc.component.spec.ts`

This task builds the component logic test-first. The template starts as a stub `<div></div>` so the component compiles; Task 4 fills it in.

- [ ] **Step 1: Create the empty scss and stub html**

Create `src/app/download-rpc/download-rpc.component.scss` as an empty file.
Create `src/app/download-rpc/download-rpc.component.html` containing exactly:

```html
<div></div>
```

- [ ] **Step 2: Write the failing component test**

```ts
/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of, throwError } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { DownloadRpcComponent } from './download-rpc.component'
import { DownloadRpcService } from './download-rpc.service'
import { ProfilesService } from '../profiles/profiles.service'
import { DomainsService } from '../domains/domains.service'
import { RpcRelease } from './download-rpc.constants'

describe('DownloadRpcComponent', () => {
  let component: DownloadRpcComponent
  let fixture: ComponentFixture<DownloadRpcComponent>
  let downloadServiceSpy: jasmine.SpyObj<DownloadRpcService>
  let profilesServiceSpy: jasmine.SpyObj<ProfilesService>
  let domainsServiceSpy: jasmine.SpyObj<DomainsService>

  const releases: RpcRelease[] = [
    { version: 'v3.0.1', assets: [{ os: 'linux', arch: 'x86_64' }, { os: 'windows', arch: 'x86_64' }] }
  ]

  beforeEach(() => {
    downloadServiceSpy = jasmine.createSpyObj('DownloadRpcService', ['getVersions', 'buildPackage'])
    profilesServiceSpy = jasmine.createSpyObj('ProfilesService', ['getData'])
    domainsServiceSpy = jasmine.createSpyObj('DomainsService', ['getData'])
    downloadServiceSpy.getVersions.and.returnValue(of(releases))
    downloadServiceSpy.buildPackage.and.returnValue(of(new Blob(['zip'], { type: 'application/zip' })))
    profilesServiceSpy.getData.and.returnValue(
      of({
        data: [
          { profileName: 'acmProfile', activation: 'acmactivate' } as any,
          { profileName: 'ccmProfile', activation: 'ccmactivate' } as any
        ],
        totalCount: 2
      })
    )
    domainsServiceSpy.getData.and.returnValue(
      of({ data: [{ profileName: 'dom1', domainSuffix: 'd.com' } as any], totalCount: 1 })
    )

    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, DownloadRpcComponent, TranslateModule.forRoot()],
      providers: [
        { provide: DownloadRpcService, useValue: downloadServiceSpy },
        { provide: ProfilesService, useValue: profilesServiceSpy },
        { provide: DomainsService, useValue: domainsServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    fixture = TestBed.createComponent(DownloadRpcComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create and load versions, profiles, domains', () => {
    expect(component).toBeTruthy()
    expect(downloadServiceSpy.getVersions).toHaveBeenCalled()
    expect(profilesServiceSpy.getData).toHaveBeenCalled()
    expect(domainsServiceSpy.getData).toHaveBeenCalled()
    expect(component.releases.length).toBe(1)
  })

  it('defaults command to activate and auth to token', () => {
    expect(component.form.get('command')?.value).toBe('activate')
    expect(component.form.get('authMode')?.value).toBe('token')
  })

  it('requires username/password only when auth is userpass', () => {
    component.form.get('authMode')?.setValue('token')
    component.onAuthModeChange()
    expect(component.form.get('username')?.hasError('required')).toBeFalse()
    component.form.get('authMode')?.setValue('userpass')
    component.onAuthModeChange()
    expect(component.form.get('username')?.hasError('required')).toBeTrue()
    expect(component.form.get('password')?.hasError('required')).toBeTrue()
  })

  it('requires domain only when activate + ACM profile selected', () => {
    component.form.get('command')?.setValue('activate')
    component.form.get('profile')?.setValue('ccmProfile')
    component.onProfileOrCommandChange()
    expect(component.isAcmSelected).toBeFalse()
    expect(component.form.get('domain')?.hasError('required')).toBeFalse()

    component.form.get('profile')?.setValue('acmProfile')
    component.onProfileOrCommandChange()
    expect(component.isAcmSelected).toBeTrue()
    expect(component.form.get('domain')?.hasError('required')).toBeTrue()
  })

  it('clears profile/domain requirements for deactivate', () => {
    component.form.get('command')?.setValue('deactivate')
    component.onProfileOrCommandChange()
    expect(component.form.get('profile')?.hasError('required')).toBeFalse()
    expect(component.form.get('domain')?.hasError('required')).toBeFalse()
  })

  it('selectedRelease exposes assets for the chosen version', () => {
    component.form.get('version')?.setValue('v3.0.1')
    component.onVersionChange()
    expect(component.availableAssets.length).toBe(2)
  })

  it('onSubmit posts a token activate request and triggers a download', () => {
    const anchorSpy = jasmine.createSpyObj('a', ['click', 'setAttribute'])
    anchorSpy.click = jasmine.createSpy('click')
    spyOn(document, 'createElement').and.returnValue(anchorSpy as any)
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url')
    spyOn(window.URL, 'revokeObjectURL')

    component.form.setValue({
      command: 'activate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      authMode: 'token',
      username: '',
      password: '',
      profile: 'ccmProfile',
      domain: ''
    })
    component.onProfileOrCommandChange()
    component.onSubmit()

    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith({
      command: 'activate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      auth: { mode: 'token' },
      profile: 'ccmProfile'
    })
    expect(anchorSpy.click).toHaveBeenCalled()
  })

  it('onSubmit includes domain for ACM and username/password for userpass', () => {
    spyOn(component as any, 'saveBlob')
    component.form.setValue({
      command: 'activate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      authMode: 'userpass',
      username: 'admin',
      password: 'secret',
      profile: 'acmProfile',
      domain: 'dom1'
    })
    component.onAuthModeChange()
    component.onProfileOrCommandChange()
    component.onSubmit()

    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith({
      command: 'activate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      auth: { mode: 'userpass', username: 'admin', password: 'secret' },
      profile: 'acmProfile',
      domain: 'dom1'
    })
  })

  it('does not submit an invalid form', () => {
    component.form.get('version')?.setValue('')
    component.form.get('command')?.setValue('activate')
    component.onProfileOrCommandChange()
    component.onSubmit()
    expect(downloadServiceSpy.buildPackage).not.toHaveBeenCalled()
  })

  it('shows an error when buildPackage fails', () => {
    downloadServiceSpy.buildPackage.and.returnValue(throwError(() => ['fail']))
    const snackSpy = spyOn((component as any).snackBar, 'open')
    component.form.setValue({
      command: 'deactivate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      authMode: 'token',
      username: '',
      password: '',
      profile: '',
      domain: ''
    })
    component.onAuthModeChange()
    component.onProfileOrCommandChange()
    component.onSubmit()
    expect(snackSpy).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- --include='**/download-rpc.component.spec.ts' --watch=false`
Expected: FAIL — cannot find module `./download-rpc.component`.

- [ ] **Step 4: Write the component**

```ts
/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card'
import { MatFormField, MatLabel, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { MatSelect } from '@angular/material/select'
import { MatOption } from '@angular/material/core'
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatSnackBar } from '@angular/material/snack-bar'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { finalize } from 'rxjs/operators'
import { ProfilesService } from '../profiles/profiles.service'
import { DomainsService } from '../domains/domains.service'
import { Profile, ACM_ACTIVATION } from '../profiles/profiles.constants'
import { Domain } from '../../models/models'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { DownloadRpcService } from './download-rpc.service'
import {
  AuthMode,
  AuthModes,
  PackageRequest,
  RpcAsset,
  RpcCommand,
  RpcCommands,
  RpcRelease,
  detectOS
} from './download-rpc.constants'

@Component({
  selector: 'app-download-rpc',
  templateUrl: './download-rpc.component.html',
  styleUrl: './download-rpc.component.scss',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatRadioGroup,
    MatRadioButton,
    MatButton,
    MatProgressBar,
    TranslateModule
  ],
  providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }]
})
export class DownloadRpcComponent implements OnInit {
  private readonly fb = inject(FormBuilder)
  private readonly downloadService = inject(DownloadRpcService)
  private readonly profilesService = inject(ProfilesService)
  private readonly domainsService = inject(DomainsService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly translate = inject(TranslateService)

  public readonly commands = RpcCommands
  public readonly authMethods = AuthModes

  public releases: RpcRelease[] = []
  public profiles: Profile[] = []
  public domains: Domain[] = []
  public availableAssets: RpcAsset[] = []
  public isAcmSelected = false
  public isLoading = false

  public form: FormGroup = this.fb.group({
    command: ['activate' as RpcCommand, Validators.required],
    version: ['', Validators.required],
    os: ['', Validators.required],
    arch: ['', Validators.required],
    authMode: ['token' as AuthMode, Validators.required],
    username: [''],
    password: [''],
    profile: [''],
    domain: ['']
  })

  ngOnInit(): void {
    this.downloadService.getVersions().subscribe({
      next: (releases) => {
        this.releases = releases
      },
      error: () => this.showError('downloadRpc.failVersions.value')
    })
    this.profilesService.getData().subscribe({
      next: (res) => {
        this.profiles = res.data
      }
    })
    this.domainsService.getData().subscribe({
      next: (res) => {
        this.domains = res.data
      }
    })
    this.onProfileOrCommandChange()
  }

  onVersionChange(): void {
    const version = this.form.get('version')?.value
    const release = this.releases.find((r) => r.version === version)
    this.availableAssets = release ? release.assets : []
    const detected = detectOS()
    const match = this.availableAssets.find((a) => a.os === detected) ?? this.availableAssets[0]
    if (match) {
      this.form.get('os')?.setValue(match.os)
      this.form.get('arch')?.setValue(match.arch)
    }
  }

  onAuthModeChange(): void {
    const userpass = this.form.get('authMode')?.value === 'userpass'
    const username = this.form.get('username')
    const password = this.form.get('password')
    if (userpass) {
      username?.setValidators([Validators.required])
      password?.setValidators([Validators.required])
    } else {
      username?.clearValidators()
      password?.clearValidators()
    }
    username?.updateValueAndValidity()
    password?.updateValueAndValidity()
  }

  onProfileOrCommandChange(): void {
    const isActivate = this.form.get('command')?.value === 'activate'
    const profileCtrl = this.form.get('profile')
    const domainCtrl = this.form.get('domain')

    if (isActivate) {
      profileCtrl?.setValidators([Validators.required])
    } else {
      profileCtrl?.clearValidators()
    }

    const selected = this.profiles.find((p) => p.profileName === profileCtrl?.value)
    this.isAcmSelected = isActivate && selected?.activation === ACM_ACTIVATION

    if (this.isAcmSelected) {
      domainCtrl?.setValidators([Validators.required])
    } else {
      domainCtrl?.clearValidators()
    }
    profileCtrl?.updateValueAndValidity()
    domainCtrl?.updateValueAndValidity()
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return
    }
    const v = this.form.value
    const request: PackageRequest = {
      command: v.command,
      version: v.version,
      os: v.os,
      arch: v.arch,
      auth:
        v.authMode === 'userpass'
          ? { mode: 'userpass', username: v.username, password: v.password }
          : { mode: 'token' }
    }
    if (v.command === 'activate') {
      request.profile = v.profile
      if (this.isAcmSelected) {
        request.domain = v.domain
      }
    }

    this.isLoading = true
    this.downloadService
      .buildPackage(request)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (blob) => {
          this.saveBlob(blob, `rpc-${request.command}-${request.os}-${request.arch}.zip`)
          this.snackBar.open(
            this.translate.instant('downloadRpc.success.value'),
            undefined,
            SnackbarDefaults.defaultSuccess
          )
        },
        error: () => this.showError('downloadRpc.failPackage.value')
      })
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  private showError(key: string): void {
    this.snackBar.open(this.translate.instant(key), undefined, SnackbarDefaults.defaultError)
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- --include='**/download-rpc.component.spec.ts' --watch=false`
Expected: PASS (all specs). Note: the stub template has no bound controls, so these tests exercise the class API directly.

- [ ] **Step 6: Commit**

```bash
git add src/app/download-rpc/download-rpc.component.ts src/app/download-rpc/download-rpc.component.html src/app/download-rpc/download-rpc.component.scss src/app/download-rpc/download-rpc.component.spec.ts
git commit -m "feat(devices): add download-rpc component logic"
```

---

### Task 4: Component template

**Files:**
- Modify: `src/app/download-rpc/download-rpc.component.html`

- [ ] **Step 1: Replace the stub template with the full form**

```html
<mat-card>
  <mat-card-header>
    <mat-card-title i18n>{{ 'downloadRpc.title.value' | translate }}</mat-card-title>
  </mat-card-header>
  @if (isLoading) {
    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
  }
  <mat-card-content>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col">
      <mat-form-field>
        <mat-label>{{ 'downloadRpc.command.label.value' | translate }}</mat-label>
        <mat-select formControlName="command" (selectionChange)="onProfileOrCommandChange()">
          @for (c of commands; track c.value) {
            <mat-option [value]="c.value">{{ c.label | translate }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ 'downloadRpc.version.label.value' | translate }}</mat-label>
        <mat-select formControlName="version" (selectionChange)="onVersionChange()">
          @for (r of releases; track r.version) {
            <mat-option [value]="r.version">{{ r.version }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ 'downloadRpc.asset.label.value' | translate }}</mat-label>
        <mat-select formControlName="os" (selectionChange)="form.get('arch')?.setValue(assetArchFor(form.get('os')?.value))">
          @for (a of availableAssets; track a.os + a.arch) {
            <mat-option [value]="a.os">{{ a.os }} / {{ a.arch }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      @if (form.get('command')?.value === 'activate') {
        <mat-form-field>
          <mat-label>{{ 'downloadRpc.profile.label.value' | translate }}</mat-label>
          <mat-select formControlName="profile" (selectionChange)="onProfileOrCommandChange()">
            @for (p of profiles; track p.profileName) {
              <mat-option [value]="p.profileName">{{ p.profileName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (isAcmSelected) {
          <mat-form-field>
            <mat-label>{{ 'downloadRpc.domain.label.value' | translate }}</mat-label>
            <mat-select formControlName="domain">
              @for (d of domains; track d.profileName) {
                <mat-option [value]="d.profileName">{{ d.profileName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      }

      <mat-radio-group formControlName="authMode" (change)="onAuthModeChange()" class="flex flex-col">
        @for (m of authMethods; track m.value) {
          <mat-radio-button [value]="m.value">{{ m.label | translate }}</mat-radio-button>
        }
      </mat-radio-group>

      @if (form.get('authMode')?.value === 'userpass') {
        <mat-form-field>
          <mat-label>{{ 'downloadRpc.username.label.value' | translate }}</mat-label>
          <input matInput formControlName="username" autocomplete="off" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ 'downloadRpc.password.label.value' | translate }}</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="off" />
        </mat-form-field>
      }

      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || isLoading">
        {{ 'downloadRpc.download.value' | translate }}
      </button>
    </form>
  </mat-card-content>
</mat-card>
```

- [ ] **Step 2: Add the `assetArchFor` helper to the component**

The template calls `assetArchFor(os)` to keep arch in sync when the user picks an OS. Add this public method to `DownloadRpcComponent` (after `onVersionChange`):

```ts
  assetArchFor(os: string): string {
    const asset = this.availableAssets.find((a) => a.os === os)
    return asset ? asset.arch : ''
  }
```

- [ ] **Step 3: Run the component tests again (template now bound)**

Run: `npm test -- --include='**/download-rpc.component.spec.ts' --watch=false`
Expected: PASS. The template renders against the mocked services from Task 3.

- [ ] **Step 4: Lint the template and TS**

Run: `npm run lint`
Expected: PASS (no errors in `download-rpc` files).

- [ ] **Step 5: Commit**

```bash
git add src/app/download-rpc/download-rpc.component.html src/app/download-rpc/download-rpc.component.ts
git commit -m "feat(devices): add download-rpc form template"
```

---

### Task 5: Register the route

**Files:**
- Modify: `src/app/routes.ts`

- [ ] **Step 1: Add the import and route**

Add the import near the other component imports at the top of `src/app/routes.ts`:

```ts
import { DownloadRpcComponent } from './download-rpc/download-rpc.component'
```

Add this route entry inside the `routes` array (e.g. after the `proxy-configs/:name` entry):

```ts
  { path: 'download-rpc', component: DownloadRpcComponent, canActivate: [AuthGuard] },
```

- [ ] **Step 2: Verify the app builds**

Run: `npm run build`
Expected: PASS — `dist/samplewebui/browser/` produced with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/routes.ts
git commit -m "feat(devices): register download-rpc route"
```

---

### Task 6: Enterprise-only navbar item

**Files:**
- Modify: `src/app/core/navbar/navbar.component.html`

The navbar component already exposes `cloudMode = environment.cloud`. The feature is Console-only, so render the item when `cloudMode === false` (mirrors the inverse of the proxy-configs gate).

- [ ] **Step 1: Add the nav item**

Insert after the `devices` nav item block (before the closing `</mat-nav-list>`):

```html
  @if (cloudMode === false) {
    <a mat-list-item routerLink="/download-rpc" routerLinkActive="active">
      <mat-icon matListItemIcon>download</mat-icon
      ><span i18n="navlink">{{ 'downloadRpc.title.value' | translate }}</span>
    </a>
  }
```

- [ ] **Step 2: Verify existing navbar tests still pass**

Run: `npm test -- --include='**/navbar.component.spec.ts' --watch=false`
Expected: PASS. (`environment.cloud` is `true` in the default test environment, so the item is not rendered — no assertion changes needed.)

- [ ] **Step 3: Commit**

```bash
git add src/app/core/navbar/navbar.component.html
git commit -m "feat(core): add enterprise-only Download RPC nav item"
```

---

### Task 7: i18n strings

**Files:**
- Modify: `src/assets/i18n/en.json`

- [ ] **Step 1: Add the `downloadRpc.*` keys**

Insert these entries into `src/assets/i18n/en.json` (anywhere among the existing keys; keep valid JSON — add a comma after the preceding entry):

```json
  "downloadRpc.title": { "description": "Download RPC page title", "value": "Download RPC" },
  "downloadRpc.command.label": { "description": "Command label", "value": "Command" },
  "downloadRpc.command.activate": { "description": "Activate command", "value": "Activate" },
  "downloadRpc.command.deactivate": { "description": "Deactivate command", "value": "Deactivate" },
  "downloadRpc.version.label": { "description": "Version label", "value": "rpc-go Version" },
  "downloadRpc.asset.label": { "description": "OS/arch label", "value": "Operating System / Architecture" },
  "downloadRpc.profile.label": { "description": "Profile label", "value": "Profile" },
  "downloadRpc.domain.label": { "description": "Domain label", "value": "Domain" },
  "downloadRpc.auth.token": { "description": "Token auth option", "value": "Generate token" },
  "downloadRpc.auth.userpass": { "description": "Username/password auth option", "value": "Username / Password" },
  "downloadRpc.username.label": { "description": "Username label", "value": "Username" },
  "downloadRpc.password.label": { "description": "Password label", "value": "Password" },
  "downloadRpc.download": { "description": "Download button", "value": "Download" },
  "downloadRpc.success": { "description": "Package success message", "value": "Package downloaded" },
  "downloadRpc.failVersions": { "description": "Version fetch failure", "value": "Failed to load rpc-go versions" },
  "downloadRpc.failPackage": { "description": "Package failure", "value": "Failed to build package" },
```

- [ ] **Step 2: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/assets/i18n/en.json','utf8')); console.log('valid')"`
Expected: prints `valid`.

- [ ] **Step 3: Commit**

```bash
git add src/assets/i18n/en.json
git commit -m "feat(devices): add download-rpc i18n strings"
```

---

### Task 8: Full verification

- [ ] **Step 1: Lint the whole repo**

Run: `npm run lint`
Expected: PASS, no errors.

- [ ] **Step 2: Run the full unit test suite (single run)**

Run: `npm run test-ci`
Expected: PASS, 100% of specs green (including the new download-rpc service/component specs and the unchanged navbar spec).

- [ ] **Step 3: Production build smoke check (token placeholders intact)**

Run: `npm run build`
Expected: PASS. (No new `##...##` tokens were added; the feature uses `environment.rpsServer`, which already resolves to `##CONSOLE_SERVER_API##` in the enterprise build.)

- [ ] **Step 4: Final commit if anything was adjusted**

```bash
git add -A
git commit -m "chore(devices): finalize download-rpc feature"
```

---

## Self-Review Notes

- **Spec coverage:** enterprise-only gate (Task 6 / Section 1) ✓; route+component (Task 3-5) ✓; version dropdown via Console (Task 2 `getVersions`) ✓; OS/arch with browser-detected default (`detectOS`, `onVersionChange`) ✓; token vs username/password (`onAuthModeChange`, request builder) ✓; activate→profile, ACM→domain (`onProfileOrCommandChange`) ✓; deactivate remote-only (no profile/domain) ✓; single POST returning a blob + download (`buildPackage`, `saveBlob`) ✓; testing (Tasks 2,3,6,8) ✓.
- **Console contract:** `GET /api/package/rpc-versions` and `POST /api/package` are a dependency, implemented in the `console` repo's own plan. UI verified with mocked HTTP until then.
- **Type consistency:** `RpcRelease`/`RpcAsset`/`PackageRequest`/`PackageAuth`, `RpcCommand`, `AuthMode`, `detectOS`, `onProfileOrCommandChange`, `onAuthModeChange`, `onVersionChange`, `assetArchFor`, `saveBlob` are used identically across service, component, template, and tests.
- **Deferred (per spec):** `configure` command tree; local deactivate.
```
