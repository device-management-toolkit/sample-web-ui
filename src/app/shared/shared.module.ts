/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

/* eslint-disable @typescript-eslint/no-extraneous-class */
import { NgModule, ModuleWithProviders } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatStepperModule } from '@angular/material/stepper'
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips'
import { MatNativeDateModule } from '@angular/material/core'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list'
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator'
import { MatSortModule } from '@angular/material/sort'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip'
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete'
import { MatLegacySnackBarModule as MatSnackBarModule, MAT_LEGACY_SNACK_BAR_DEFAULT_OPTIONS as MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/legacy-snack-bar'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle'
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs'
import { MatTreeModule } from '@angular/material/tree'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { ClipboardModule } from '@angular/cdk/clipboard'
import { DragDropModule } from '@angular/cdk/drag-drop'

// import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FlexLayoutModule } from '@angular/flex-layout'
import { CdkTableModule } from '@angular/cdk/table'
import { AreYouSureDialogComponent } from './are-you-sure/are-you-sure.component'
import { PowerUpAlertComponent } from './power-up-alert/power-up-alert.component'
import { DialogContentComponent } from './dialog-content/dialog-content.component'
import { AddDeviceComponent } from './add-device/add-device.component'
import { RandomPassAlertComponent } from './random-pass-alert/random-pass-alert.component'
import { StaticCIRAWarningComponent } from './static-cira-warning/static-cira-warning.component'

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MatNativeDateModule,
    MatTableModule,
    MatTreeModule,
    MatMenuModule,
    CdkTableModule,
    MatButtonToggleModule,
    MatRadioModule,
    MatSortModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatGridListModule,
    MatChipsModule,
    MatSelectModule,
    MatListModule,
    MatCardModule,
    MatAutocompleteModule,
    MatStepperModule,
    MatDialogModule,
    MatSidenavModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatPaginatorModule,
    ClipboardModule,
    DragDropModule
  ],
  exports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatTableModule,
    MatTreeModule,
    MatIconModule,
    MatSortModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatGridListModule,
    MatRadioModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatListModule,
    MatStepperModule,
    MatChipsModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatToolbarModule,
    MatTabsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatProgressBarModule, MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSidenavModule,
    MatPaginatorModule,
    CdkTableModule,
    MatNativeDateModule,
    ClipboardModule,
    DragDropModule
  ],
  providers: [
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 30000, panelClass: ['success', 'mat-elevation-z12'] } }
  ],
  declarations: [AreYouSureDialogComponent, PowerUpAlertComponent, DialogContentComponent, AddDeviceComponent, RandomPassAlertComponent, StaticCIRAWarningComponent]
})
export class OpenAMTMaterialModule {

}

@NgModule({
  declarations: [],
  exports: [OpenAMTMaterialModule],
  imports: [
    CommonModule,
    OpenAMTMaterialModule
  ]
})
export class SharedModule {
  static forRoot (): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: []
    }
  }
}
