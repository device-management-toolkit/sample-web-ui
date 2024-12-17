import { Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'app-key-display-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ClipboardModule,
    MatIconModule
  ],
  templateUrl: './key-display-dialog.component.html',
  styleUrl: './key-display-dialog.component.scss'
})
export class KeyDisplayDialogComponent {
  data = inject(MAT_DIALOG_DATA)
  private clipboard = inject(Clipboard)

  key = ''
  constructor() {
    const data = this.data

    this.key = data.key
  }

  copyKey() {
    this.clipboard.copy(this.key)
  }
}
