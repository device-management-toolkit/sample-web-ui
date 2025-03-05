import { Pipe, PipeTransform } from '@angular/core'
import { formatDistanceToNow, isValid } from 'date-fns'

@Pipe({
  name: 'amTimeAgoFormatter'
})
export class AmTimeAgoFormatterPipe implements PipeTransform {
  transform(date: Date | string | number, addSuffix = true): string {
    if (!date) return ''
    const parsedDate = new Date(date)
    if (!isValid(parsedDate)) return 'Invalid Date'
    return formatDistanceToNow(parsedDate, { addSuffix: addSuffix })
  }
}
