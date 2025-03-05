import { AmDateFormatterPipe } from './date-formatter.pipe.ts.pipe'

describe('AmDateFormatterPipe', () => {
  let pipe: AmDateFormatterPipe

  beforeEach(() => {
    pipe = new AmDateFormatterPipe()
  })

  it('create an instance', () => {
    expect(pipe).toBeTruthy()
  })

  it('should format date correctly', () => {
    const date = new Date('2025-03-05T12:00:00Z')
    const result = pipe.transform(date, 'MMMM d, yyyy')
    expect(result).toBe('March 5, 2025')
  })

  it('should format date string correctly', () => {
    const date = '2025-03-05T12:00:00Z'
    const result = pipe.transform(date, 'MMMM d, yyyy')
    expect(result).toBe('March 5, 2025')
  })

  it('should format timestamp correctly', () => {
    const timestamp = Date.parse('2025-03-05T12:00:00Z')
    const result = pipe.transform(timestamp, 'MMMM d, yyyy')
    expect(result).toBe('March 5, 2025')
  })

  it('should return empty string if no date is provided', () => {
    const result = pipe.transform('')
    expect(result).toBe('')
  })

  it('should handle invalid date input gracefully', () => {
    const result = pipe.transform('invalid-date')
    expect(result).toBe('Invalid Date')
  })
})
