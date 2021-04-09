/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
/* eslint-disable @typescript-eslint/no-extraneous-class */
import { NgModule, ModuleWithProviders } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatStepperModule } from '@angular/material/stepper'
import { MatChipsModule } from '@angular/material/chips'
import { MatNativeDateModule } from '@angular/material/core'
import { MatTableModule } from '@angular/material/table'
import { MatCardModule } from '@angular/material/card'
import { MatDialogModule } from '@angular/material/dialog'
import { MatListModule } from '@angular/material/list'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatSortModule } from '@angular/material/sort'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatMenuModule } from '@angular/material/menu'
import { MatButtonModule } from '@angular/material/button'
import { MatTabsModule } from '@angular/material/tabs'
import { MatTreeModule } from '@angular/material/tree'
import { MatButtonToggleModule } from '@angular/material/button-toggle'

// import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FlexLayoutModule } from '@angular/flex-layout'
import { CdkTableModule } from '@angular/cdk/table'
import { AreYouSureDialogComponent } from './are-you-sure/are-you-sure.component'
import { PowerUpAlertComponent } from './power-up-alert/power-up-alert.component'
import { DialogContentComponent } from './dialog-content/dialog-content.component'
// import { HttpClientModule } from '@angular/common/http'

@NgModule({
  imports: [
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
    MatPaginatorModule
  ],
  exports: [
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
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 30000, panelClass: ['success', 'mat-elevation-z12'] } }
  ],
  declarations: [AreYouSureDialogComponent, PowerUpAlertComponent, DialogContentComponent]
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
