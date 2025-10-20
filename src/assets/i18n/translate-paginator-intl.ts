import { inject, Injectable } from '@angular/core'
import { MatPaginatorIntl } from '@angular/material/paginator'
import { TranslateService } from '@ngx-translate/core'

@Injectable()
export class TranslatePaginatorIntl extends MatPaginatorIntl {
  private readonly translate = inject(TranslateService)
  constructor() {
    super()
    this.translateLabels()

    this.translate.onLangChange.subscribe(() => {
      this.translateLabels()
      this.changes.next()
    })
  }

  private translateLabels(): void {
    this.itemsPerPageLabel = this.translate.instant('configs.paginator.itemsPerPageLabel.value')
    this.nextPageLabel = this.translate.instant('configs.paginator.nextPageLabel.value')
    this.previousPageLabel = this.translate.instant('configs.paginator.previousPageLabel.value')
    this.firstPageLabel = this.translate.instant('configs.paginator.firstPageLabel.value')
    this.lastPageLabel = this.translate.instant('configs.paginator.lastPageLabel.value')

    this.getRangeLabel = (page: number, pageSize: number, length: number): string => {
      if (length === 0 || pageSize === 0) {
        return this.translate.instant('configs.paginator.range.value', {
          startIndex: 0,
          endIndex: 0,
          length: length
        })
      }
      const startIndex = page * pageSize
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize

      return this.translate.instant('configs.paginator.range.value', {
        startIndex: startIndex + 1,
        endIndex: endIndex,
        length: length
      })
    }
  }
}
