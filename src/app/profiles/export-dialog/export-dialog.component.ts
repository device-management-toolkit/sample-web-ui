import { Component, inject, OnInit } from '@angular/core'

import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { FormsModule } from '@angular/forms'
import { MatDialogContent, MatDialogActions, MatDialogRef, MatDialogModule } from '@angular/material/dialog'
import { MatCardModule } from '@angular/material/card'
import { DomainsService } from 'src/app/domains/domains.service'
import { Domain } from 'src/models/models'
import { MatButtonModule } from '@angular/material/button'
import { Router, RouterModule } from '@angular/router'

@Component({
  selector: 'app-export-dialog',
  imports: [
    MatFormFieldModule,
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    RouterModule,
    MatCardModule
  ],
  templateUrl: './export-dialog.component.html',
  styleUrl: './export-dialog.component.scss'
})
export class ExportDialogComponent implements OnInit {
  // Dependency Injection
  private readonly domainService = inject(DomainsService)
  private readonly dialogRef = inject(MatDialogRef<ExportDialogComponent>)
  private readonly router = inject(Router)

  public errorMessages: string[] = []
  public domains: Domain[] = []
  public selectedDomain = ''

  ngOnInit(): void {
    this.getDomains()
  }

  getDomains(): void {
    this.domainService.getData().subscribe({
      next: (domainRsp) => {
        this.domains = domainRsp.data
        // Set default value to first domain if domains exist
        if (this.domains.length > 0) {
          this.selectedDomain = this.domains[0].profileName
        }
      },
      error: (error) => {
        this.errorMessages = error
      }
    })
  }
  onSelectionChange(event: any): void {
    this.selectedDomain = event.value
  }
  onCancel(): void {
    this.dialogRef.close()
  }
  async navigateToDomains(): Promise<void> {
    this.dialogRef.close()
    await this.router.navigate(['/domains', 'new'])
  }
}
