import { Component, inject, signal, computed, effect, DestroyRef, type OnInit } from '@angular/core'
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { MatDialogContent, MatDialogActions, MatDialogRef, MatDialogModule } from '@angular/material/dialog'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { Router } from '@angular/router'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { DomainsService } from 'src/app/domains/domains.service'
import { type Domain } from 'src/models/models'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-export-dialog',
  imports: [
    MatFormFieldModule,
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './export-dialog.component.html',
  styleUrl: './export-dialog.component.scss'
})
export class ExportDialogComponent implements OnInit {
  // Dependency Injection
  private readonly domainService = inject(DomainsService)
  private readonly dialogRef = inject(MatDialogRef<ExportDialogComponent>)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)

  // Signals for reactive state management
  readonly domains = signal<Domain[]>([])
  readonly errorMessages = signal<string[]>([])
  readonly isLoading = signal(false)

  // Form control with reactive forms
  readonly selectedDomainControl = new FormControl<string | null>(null, [Validators.required])

  // Signal for form value to make it reactive
  readonly formValue = signal<string | null>(null)

  // Computed signals for derived state
  readonly hasNoDomains = computed(() => this.domains().length === 0)
  readonly selectedDomain = computed(() => this.formValue() ?? '')
  readonly isFormValid = computed(() => {
    const value = this.formValue()
    const isControlValid = this.selectedDomainControl.valid
    return isControlValid && value != null && value !== ''
  })

  constructor() {
    // Subscribe to form control value changes
    this.selectedDomainControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.formValue.set(value)
    })

    // Effect to set default domain when domains are loaded
    effect(() => {
      const domainsArray = this.domains()
      if (domainsArray.length > 0 && !this.selectedDomainControl.value) {
        this.selectedDomainControl.setValue(domainsArray[0].profileName)
      }
    })

    // Initialize form value signal
    this.formValue.set(this.selectedDomainControl.value)
  }

  ngOnInit(): void {
    this.getDomains()
  }

  getDomains(): void {
    this.isLoading.set(true)
    this.errorMessages.set([])

    this.domainService
      .getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (domainRsp) => {
          this.domains.set(domainRsp.data)
          this.isLoading.set(false)
        },
        error: (error) => {
          this.errorMessages.set(error)
          this.isLoading.set(false)
        }
      })
  }

  onCancel(): void {
    this.dialogRef.close()
  }

  async navigateToDomains(): Promise<void> {
    this.dialogRef.close()
    await this.router.navigate(['/domains', 'new'])
  }

  onOk(): void {
    if (this.isFormValid()) {
      this.dialogRef.close(this.selectedDomain())
    }
  }

  onSkipDomain(): void {
    this.dialogRef.close('none')
  }
}
