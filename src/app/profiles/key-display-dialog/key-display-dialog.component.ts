import { Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-key-display-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ClipboardModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './key-display-dialog.component.html',
  styleUrl: './key-display-dialog.component.scss'
})
export class KeyDisplayDialogComponent {
  private readonly data = inject(MAT_DIALOG_DATA)
  private readonly clipboard = inject(Clipboard)

  public key = ''

  constructor() {
    const data = this.data
    this.key = data.key
  }

  copyKey() {
    this.clipboard.copy(this.key)
  }
}
