import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'app-key-display-dialog',
  standalone: true,
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
  key = ''
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private clipboard: Clipboard
  ) {
    this.key = data.key
  }

  copyKey() {
    this.clipboard.copy(this.key)
  }
}
