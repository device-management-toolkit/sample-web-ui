import { Pipe, PipeTransform } from '@angular/core'
import { format, isValid } from 'date-fns'

@Pipe({
  name: 'amDateFormatter'
})
export class AmDateFormatterPipe implements PipeTransform {
  transform(date: Date | string | number, useFormat = 'MMMM d, yyyy h:mma'): string {
    if (!date) return ''
    const parsedDate = new Date(date)
    if (!isValid(parsedDate)) return 'Invalid Date'
    return format(parsedDate, useFormat)
  }
}
